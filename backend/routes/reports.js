const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Complaint = require('../models/Complaint');
const DeliveryRequest = require('../models/DeliveryRequest');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Monthly distribution stats
        const monthlyDistribution = await Order.aggregate([
            { $group: { _id: { $month: '$purchaseDate' }, totalOrders: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
            { $sort: { '_id': 1 } }
        ]);

        // Shop performance
        const shopPerformance = await Shop.find({ status: 'active' }).select('shopId name usersServed stock district').sort({ usersServed: -1 }).limit(10);

        // Delivery stats
        const deliveryStats = await DeliveryRequest.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Complaint resolution rate
        const totalComplaints = await Complaint.countDocuments();
        const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
        const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

        // User category breakdown
        const userCategories = await User.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDistribution = months.map((m, i) => {
            const found = monthlyDistribution.find(r => r._id === i + 1);
            return { month: m, orders: found ? found.totalOrders : 0, amount: found ? found.totalAmount : 0 };
        });

        res.json({
            monthlyDistribution: formattedDistribution,
            shopPerformance,
            deliveryStats,
            complaintResolutionRate: resolutionRate,
            totalComplaints,
            resolvedComplaints,
            userCategories
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
