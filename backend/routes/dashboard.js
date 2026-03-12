const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Stock = require('../models/Stock');
const DeliveryRequest = require('../models/DeliveryRequest');
const Complaint = require('../models/Complaint');
const FraudAlert = require('../models/FraudAlert');
const router = express.Router();

router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalShops, totalOrders, pendingDeliveries, totalComplaints, fraudAlerts] = await Promise.all([
            User.countDocuments(),
            Shop.countDocuments(),
            Order.countDocuments(),
            DeliveryRequest.countDocuments({ status: 'pending' }),
            Complaint.countDocuments(),
            FraudAlert.countDocuments({ status: 'new' })
        ]);

        const stocks = await Stock.find({ year: 2026, month: 3 });
        const stockSummary = {
            rice: { total: 0, remaining: 0, distributed: 0 },
            wheat: { total: 0, remaining: 0, distributed: 0 },
            sugar: { total: 0, remaining: 0, distributed: 0 },
            kerosene: { total: 0, remaining: 0, distributed: 0 }
        };
        stocks.forEach(s => { 
            if (stockSummary[s.commodity]) {
                stockSummary[s.commodity].total += s.totalQuantity || 0;
                stockSummary[s.commodity].remaining += s.remaining || 0;
                stockSummary[s.commodity].distributed += s.distributed || 0;
            }
        });

        res.json({ totalUsers, totalShops, totalOrders, pendingDeliveries, totalComplaints, fraudAlerts, stockSummary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Monthly distribution data for charts
router.get('/monthly-distribution', async (req, res) => {
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = [];
        for (let m = 1; m <= 12; m++) {
            const stocks = await Stock.find({ year: 2025, month: m });
            const entry = { month: months[m - 1] };
            stocks.forEach(s => { entry[s.commodity] = s.distributed; });
            data.push(entry);
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// User registration growth
router.get('/user-growth', async (req, res) => {
    try {
        const result = await User.aggregate([
            { $group: { _id: { $month: '$registeredAt' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
        ]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = months.map((m, i) => {
            const found = result.find(r => r._id === i + 1);
            return { month: m, users: found ? found.count : 0 };
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
