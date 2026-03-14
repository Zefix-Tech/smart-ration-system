const express = require('express');
const Stock = require('../models/Stock');
const router = express.Router();

// Get current stock levels
router.get('/', async (req, res) => {
    try {
        const { year = 2026, month = 3 } = req.query;
        const stocks = await Stock.find({ year: parseInt(year), month: parseInt(month) });
        res.json(stocks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Stock trends (last 6 months)
router.get('/trends', async (req, res) => {
    try {
        const stocks = await Stock.find().sort({ year: 1, month: 1 });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const grouped = {};
        stocks.forEach(s => {
            const key = `${months[s.month - 1]} ${s.year}`;
            if (!grouped[key]) grouped[key] = { period: key };
            grouped[key][s.commodity] = s.distributed;
        });
        res.json(Object.values(grouped));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Low stock alerts
router.get('/alerts', async (req, res) => {
    try {
        const stocks = await Stock.find({ year: 2026, month: 3 });
        
        // Aggregate by commodity (if multiple shops or entries exist)
        const summary = {};
        stocks.forEach(s => {
            if (!summary[s.commodity]) {
                summary[s.commodity] = { remaining: 0, total: 0 };
            }
            summary[s.commodity].remaining += s.remaining || 0;
            summary[s.commodity].total += s.totalQuantity || 0;
        });

        // Filter for < 20% remaining
        const alerts = Object.entries(summary)
            .map(([commodity, data]) => ({
                commodity,
                remaining: data.remaining,
                total: data.total,
                percentage: data.total > 0 ? Math.round((data.remaining / data.total) * 100) : 0
            }))
            .filter(alert => alert.percentage < 20); // Only critical stocks

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Manual Stock Update (Admin Dashboard)
router.post('/update', async (req, res) => {
    try {
        const { year = new Date().getFullYear(), month = new Date().getMonth() + 1, rice, wheat, sugar } = req.body;
        
        // Helper to update or create
        const updateCommodity = async (commodity, quantity) => {
            if (quantity === undefined || quantity === '') return;
            let stock = await Stock.findOne({ year, month, commodity, shop: null });
            if (stock) {
                stock.totalQuantity += Number(quantity);
                stock.remaining = (stock.remaining || 0) + Number(quantity);
                await stock.save();
            } else {
                await Stock.create({ year, month, commodity, shop: null, totalQuantity: Number(quantity), remaining: Number(quantity), distributed: 0 });
            }
        };

        if (rice !== undefined) await updateCommodity('rice', rice);
        if (wheat !== undefined) await updateCommodity('wheat', wheat);
        if (sugar !== undefined) await updateCommodity('sugar', sugar);

        const Notification = require('../models/Notification');
        const adminNotification = new Notification({
            title: 'New Stock Allocation',
            message: `New month stock allocated for ${month}/${year}.`,
            type: 'stock_update',
            recipientRole: 'admin',
            priority: 'normal'
        });
        await adminNotification.save();

        res.json({ success: true, message: 'Stock updated successfully. System alert sent to admins.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
