const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Complaint = require('../models/Complaint');
const DeliveryRequest = require('../models/DeliveryRequest');
const Shop = require('../models/Shop');

// 1. Transactions Value by Month
// GET /api/admin/analytics/transactions-monthly
router.get('/transactions-monthly', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        
        const monthlyDistribution = await Order.aggregate([
            {
                $match: {
                    purchaseDate: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$purchaseDate' },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const data = new Array(12).fill(0);

        monthlyDistribution.forEach(item => {
            if (item._id >= 1 && item._id <= 12) {
                data[item._id - 1] = item.totalAmount || 0;
            }
        });

        res.json({ labels, data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Resolution Core Metrics
// GET /api/admin/analytics/complaint-resolution
router.get('/complaint-resolution', async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
        const resolutionRate = totalComplaints === 0 ? 0 : Math.round((resolvedComplaints / totalComplaints) * 100);
        
        res.json({
            totalComplaints,
            resolvedComplaints,
            resolutionRate
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Delivery Requests Status
// GET /api/admin/analytics/delivery-status
router.get('/delivery-status', async (req, res) => {
    try {
        const statusCounts = await DeliveryRequest.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const result = {
            approved: 0,
            rejected: 0,
            pending: 0
        };

        statusCounts.forEach(item => {
            if (item._id && result[item._id] !== undefined) {
                result[item._id] = item.count;
            } else if (item._id) {
                // In case status strings are capitalized or slightly different
                const normalized = item._id.toLowerCase();
                if (result[normalized] !== undefined) {
                    result[normalized] = item.count;
                }
            }
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Top Performing Ration Shops
// GET /api/admin/analytics/top-ration-shops
router.get('/top-ration-shops', async (req, res) => {
    try {
        const topShops = await Shop.aggregate([
            { $sort: { usersServed: -1 } },
            { $limit: 5 },
            { 
                $project: { 
                    _id: 0, 
                    shopId: 1, 
                    name: 1, 
                    district: 1, 
                    usersServed: 1 
                } 
            }
        ]);

        res.json(topShops);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. Current Month Usage (Pie Chart Data)
// GET /api/admin/analytics/current-month-usage
router.get('/current-month-usage', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const usage = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    purchaseDate: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.commodity',
                    total: { $sum: '$items.quantity' }
                }
            }
        ]);

        const result = { rice: 0, wheat: 0, sugar: 0, kerosene: 0 };
        usage.forEach(item => {
            if (result[item._id] !== undefined) {
                result[item._id] = item.total;
            }
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
