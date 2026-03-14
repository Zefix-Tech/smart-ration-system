const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const DeliveryRequest = require('../models/DeliveryRequest');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

// Middleware to inject shopId
const getShop = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.admin.id).populate('shop');
        if (!admin || !admin.shop) {
            return res.status(403).json({ message: 'No shop associated with this admin' });
        }
        req.shopId = admin.shop._id;
        next();
    } catch (err) {
        res.status(500).json({ message: 'Server error verifying shop' });
    }
};

// Apply middleware
router.use(getShop);

// 0. Get Shop User Details
// GET /api/shop/me
router.get('/me', async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('name role');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.json({
            id: admin._id,
            name: admin.name,
            role: admin.role
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 1. Purchase Requests
// GET /api/shop/purchase-requests
router.get('/purchase-requests', async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const orders = await Order.find({ shop: req.shopId, status })
            .populate('user', 'name phone rationCard category address familyMembers')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 2. Delivery Requests
// GET /api/shop/delivery-requests
router.get('/delivery-requests', async (req, res) => {
    try {
        // Find orders with delivery deliveryType/delivery requested
        // Using the custom Delivery schema from earlier phases
        const deliveries = await DeliveryRequest.find({ shop: req.shopId })
            .populate('user', 'name phone rationCard address category')
            .sort({ createdAt: -1 });
        res.json(deliveries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 3. Complaints
// GET /api/shop/complaints
router.get('/complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find({ shop: req.shopId })
            .populate('user', 'name phone rationCard')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 4. Notifications
// GET /api/shop/notifications
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            $or: [
                { recipientRole: 'all' },
                { recipientRole: 'shop', shopId: req.shopId },
                { recipientRole: 'all', shopId: req.shopId }, // Shop-wide broadcas
                { recipientRole: 'shop', shopId: { $exists: false } }, // Global shop alerts
                { targetAudience: 'all' }, // Backward compatibility
                { targetAudience: 'shop_owners' } // Backward compatibility
            ]
        }).sort({ sentAt: -1 }).lean();

        const mapped = notifications.map(notif => ({
            ...notif,
            isRead: notif.readBy?.map(id => id.toString()).includes(req.admin.id) || false
        }));

        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 5. Distribution Records
// GET /api/shop/distributions 
router.get('/distributions', async (req, res) => {
    try {
        // For distribution history, combine completed orders and completed deliveries
        // Note: For simplicity, just sending completed Orders here
        const distributions = await Order.find({ shop: req.shopId, status: 'completed' })
            .populate('user', 'name phone rationCard category')
            .sort({ updatedAt: -1 })
            .limit(100);
        res.json(distributions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 6. Donations
// GET /api/shop/donations
router.get('/donations', async (req, res) => {
    try {
        const Donation = require('../models/Donation');
        // Let's assume donations where assignedTo is not empty and they are somehow linked or just 
        // return global unassigned ones or assigned ones. Usually, a donation could be mapped to a shop via `donor` (User).
        // Since we don't have a direct shop reference in Donation model, we will return donations globally 
        // or just mock it for the shop tracking distribution.
        const donations = await Donation.find().sort({ createdAt: -1 }).limit(50);
        res.json(donations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 7. Shop Empty Alert - Pending Users Analytics
// GET /api/shop/alerts/pending-users
router.get('/alerts/pending-users', async (req, res) => {
    try {
        const User = require('../models/User');
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. Get all users registered for this shop
        const shopUsers = await User.find({ shopId: req.shopId }).select('name phone');

        // 2. Get unique user IDs who have completed orders this month at this shop
        const completedOrders = await Order.find({
            shop: req.shopId,
            status: 'completed',
            purchaseDate: { $gte: startOfMonth, $lte: endOfMonth }
        }).distinct('user');

        const purchasedUserIds = completedOrders.map(id => id.toString());

        // 3. Identify pending users
        const pendingUsers = shopUsers.filter(u => !purchasedUserIds.includes(u._id.toString()));

        res.json({
            totalUsers: shopUsers.length,
            purchasedUsers: purchasedUserIds.length,
            remainingUsers: pendingUsers.length,
            users: pendingUsers
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 8. Shop Empty Alert - Broadcast Notification
// POST /api/shop/alerts/send
router.post('/alerts/send', async (req, res) => {
    try {
        const User = require('../models/User');
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const shopUsers = await User.find({ shopId: req.shopId }).select('_id');
        const completedOrders = await Order.find({
            shop: req.shopId,
            status: 'completed',
            purchaseDate: { $gte: startOfMonth, $lte: endOfMonth }
        }).distinct('user');

        const purchasedUserIds = completedOrders.map(id => id.toString());
        const pendingUserIds = shopUsers
            .map(u => u._id)
            .filter(id => !purchasedUserIds.includes(id.toString()));

        if (pendingUserIds.length === 0) {
            return res.status(400).json({ message: 'No pending users to notify' });
        }

        const notifications = pendingUserIds.map(userId => ({
            title: 'Shop Alert: Collection Reminder',
            message: 'Ration shop is currently free. Please collect your ration now.',
            type: 'alert',
            priority: 'high',
            sentBy: req.admin.id,
            recipientRole: 'citizen',
            recipientId: userId,
            shopId: req.shopId
        }));

        await Notification.insertMany(notifications);

        res.json({ 
            success: true, 
            message: `Alert sent to ${pendingUserIds.length} users successfully.`,
            count: pendingUserIds.length 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 9. Dashboard Statistics
// GET /api/shop/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const User = require('../models/User');
        const Shop = require('../models/Shop');
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. Core Counts
        const totalUsers = await User.countDocuments({ shopId: req.shopId });
        const monthlyPurchases = await Order.countDocuments({
            shop: req.shopId,
            status: 'completed',
            updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // 2. Stock Levels
        const shop = await Shop.findById(req.shopId).select('stock');

        // 3. Distribution History (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const distributionHistory = await Order.aggregate([
            {
                $match: {
                    shop: req.shopId,
                    status: 'completed',
                    updatedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Transform distribution history into a contiguous 7-day array
        const weekData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const match = distributionHistory.find(h => h._id === dateStr);
            weekData.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                count: match ? match.count : 0
            });
        }

        // 4. Delivery Stats
        const [pendingDeliveries, completedDeliveries] = await Promise.all([
            DeliveryRequest.countDocuments({ shop: req.shopId, status: { $in: ['pending', 'approved', 'dispatched'] } }),
            DeliveryRequest.countDocuments({ shop: req.shopId, status: 'delivered' })
        ]);

        res.json({
            stats: {
                totalUsers,
                monthlyPurchases,
                pendingUsers: Math.max(0, totalUsers - monthlyPurchases),
                completionRate: totalUsers > 0 ? Math.round((monthlyPurchases / totalUsers) * 100) : 0,
                pendingDeliveries,
                completedDeliveries
            },
            stock: shop?.stock || {},
            history: weekData
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delivery team management (sub-router reuses getShop via router.use above)
const deliveryTeamRouter = require('./delivery-team');
router.use('/delivery-team', deliveryTeamRouter);

module.exports = router;
