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
        const alerts = stocks.filter(s => s.remaining < s.totalQuantity * 0.2).map(s => ({
            commodity: s.commodity,
            remaining: s.remaining,
            total: s.totalQuantity,
            percentage: Math.round((s.remaining / s.totalQuantity) * 100)
        }));
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

        res.json({ success: true, message: 'Stock updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
