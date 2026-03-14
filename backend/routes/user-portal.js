const express = require('express');
const { auth } = require('../middleware/auth');
const Stock = require('../models/Stock');
const Order = require('../models/Order');
const MonthlyRation = require('../models/MonthlyRation');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const DeliveryRequest = require('../models/DeliveryRequest');
const Complaint = require('../models/Complaint');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Defensive fallback: Ensure req.user is populated if req.admin exists (stale middleware protection)
router.use((req, res, next) => {
    if (!req.user && req.admin) req.user = req.admin;
    if (!req.user) {
        return res.status(403).json({ message: 'Access Denied: No user information found in request' });
    }
    next();
});

// Get User Dashboard Summary
router.get('/summary', async (req, res) => {
    try {
        console.log('User Summary Request for ID:', req.user?.id);
        const user = await User.findById(req.user.id).populate('shopId').lean();
        if (!user || !user.shopId) return res.status(404).json({ message: 'Shop allocation not found' });

        const recentPurchases = await Order.find({ user: user._id }).limit(5).sort({ createdAt: -1 }).lean();
        const activeDelivery = await DeliveryRequest.findOne({ 
            user: user._id, 
            status: { $in: ['pending', 'approved', 'dispatched', 'delivered'] } 
        }).sort({ updatedAt: -1 }).lean();

        // user.shopId.stock is a plain object now thanks to .lean()
        const stockItems = [];
        const stockData = user.shopId.stock || {};
        
        for (const [commodity, quantity] of Object.entries(stockData)) {
            if (commodity !== '_id') {
                stockItems.push({ commodity, quantity });
            }
        }

        res.json({
            stock: stockItems,
            purchaseStatus: recentPurchases.length > 0 ? recentPurchases[0].status : 'No recent purchases',
            deliveryStatus: activeDelivery ? activeDelivery.status : 'None',
            user: {
                name: user.name,
                rationCard: user.rationCard,
                shop: user.shopId.name,
                eligibilityStatus: user.eligibilityStatus
            }
        });
    } catch (err) {
        console.error('SERVER ERROR IN SUMMARY:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
});

// View Ration Stock
router.get('/stock', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('shopId').lean();
        if (!user || !user.shopId) return res.status(404).json({ message: 'Shop allocation not found' });
        
        const stockItems = [];
        const stockData = user.shopId.stock || {};
        for (const [commodity, quantity] of Object.entries(stockData)) {
            if (commodity !== '_id') {
                stockItems.push({ commodity, quantity });
            }
        }
        
        res.json(stockItems);
    } catch (err) {
        console.error('Stock API Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Check Ration Request Status for Current Month
router.get('/check-request-status', async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        const existingOrder = await Order.findOne({
            user: req.user.id,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        res.json({ hasRequested: !!existingOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Request Ration
router.post('/request-ration', async (req, res) => {
    try {
        console.log('Ration Request for User:', req.user.id);
        const user = await User.findById(req.user.id);
        
        if (!user || !user.shopId) {
            return res.status(404).json({ message: 'User or Shop not found' });
        }

        // --- Monthly Restriction Check ---
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        const existingOrder = await Order.findOne({
            user: user._id,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        if (existingOrder) {
            return res.status(400).json({ message: 'You have already placed a ration request for this month.' });
        }
        // ---------------------------------

        // Auto-calculate ration allocation based on family members
        const familySize = user.familyMembers || 1;
        const autoItems = [
            { commodity: 'rice', quantity: familySize * 5, unit: 'kg' },
            { commodity: 'wheat', quantity: familySize * 2, unit: 'kg' },
            { commodity: 'sugar', quantity: 1, unit: 'kg' }
        ];
        
        const order = new Order({
            user: user._id, // Ensure we use the full user object
            shop: user.shopId,
            items: autoItems,
            status: 'pending' // Citizen request starts as pending
        });

        await order.save();
        res.json({ success: true, message: 'Ration request submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Purchase History
router.get('/history', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Ration Status for Citizen (Active Requests & Purchase History)
// GET /api/citizen/ration-status
router.get('/ration-status', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        const deliveries = await DeliveryRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
        
        const activeRequests = orders.filter(o => ['pending', 'approved', 'out_for_delivery', 'dispatched'].includes(o.status));
        const purchaseHistory = orders.filter(o => ['completed', 'delivered'].includes(o.status));

        // Map to requested format
        const formatHistory = purchaseHistory.map(o => ({
            date: o.createdAt.toISOString().split('T')[0],
            items: o.items.map(i => `${i.commodity.charAt(0).toUpperCase() + i.commodity.slice(1)} ${i.quantity}${i.unit}`),
            status: o.status, // Keep raw for frontend badge logic
            transactionId: o._id.toString().slice(-8).toUpperCase()
        }));

        res.json({
            activeRequests: activeRequests.map(o => ({
                id: o._id,
                date: o.createdAt.toISOString().split('T')[0],
                items: o.items.map(i => `${i.commodity.charAt(0).toUpperCase() + i.commodity.slice(1)} ${i.quantity}${i.unit}`),
                status: o.status // Keep raw for frontend badge logic
            })),
            purchaseHistory: formatHistory,
            deliveryRequests: deliveries.map(d => ({
                id: d._id,
                date: d.createdAt.toISOString().split('T')[0],
                reason: d.reason.replace(/_/g, ' ').toUpperCase(),
                status: d.status, // Keep raw for frontend badge logic
                address: d.address
            }))
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delivery Request
router.post('/request-delivery', async (req, res) => {
    try {
        const { reason, description, certificateUrl, address } = req.body;
        
        // 1. Fetch complete user data to check eligibility and shopId
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.eligibilityStatus !== 'VERIFIED') {
            return res.status(403).json({ 
                message: 'Access Denied: Your home delivery eligibility has not been verified yet by an admin.' 
            });
        }

        // 2. Find the user's latest pending order to link
        const latestPendingOrder = await Order.findOne({ 
            user: req.user.id, 
            status: 'pending' 
        }).sort({ createdAt: -1 });

        if (!latestPendingOrder) {
            return res.status(400).json({ 
                message: 'No pending ration purchase found. Please request your ration first.' 
            });
        }

        const delivery = new DeliveryRequest({
            user: req.user.id,
            reason,
            description,
            certificateUrl,
            address: address || user.address,
            status: 'pending',
            shop: user.shopId, // Link to shop
            order: latestPendingOrder._id // Link to order
        });
        
        await delivery.save();
        res.json({ success: true, message: 'Delivery request submitted successfully and sent to your local shop.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Submit Complaint
router.post('/complaints', async (req, res) => {
    try {
        const { subject, message, category } = req.body;
        const user = await User.findById(req.user.id);
        const complaint = new Complaint({
            user: req.user.id,
            shop: user?.shopId || null,
            subject,
            message,
            category,
            status: 'open'
        });
        await complaint.save();
        res.json({ success: true, message: 'Complaint submitted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get User Complaints
router.get('/complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Notifications
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ 
            $or: [
                { recipientRole: 'all' },
                { recipientRole: 'citizen', recipientId: userId },
                { recipientRole: 'citizen', shopId: { $exists: false }, recipientId: { $exists: false } }, // Global citizen announcements
                { targetAudience: 'all' }, // Backward compatibility
                { targetAudience: 'users' } // Backward compatibility
            ]
        }).sort({ sentAt: -1 }).lean();
        
        const mapped = notifications.map(notif => ({
            ...notif,
            isRead: notif.readBy?.map(id => id.toString()).includes(userId) || false
        }));
        
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark user notifications as read
router.post('/notifications/mark-read', async (req, res) => {
    try {
        const { notificationIds } = req.body;
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $addToSet: { readBy: req.user.id } }
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('shopId').select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/profile', async (req, res) => {
    try {
        const { phone, address, age, gender, pregnancyStatus, disabilityStatus, medicalCondition } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id, 
            { phone, address, age, gender, pregnancyStatus, disabilityStatus, medicalCondition }, 
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        const hashedPw = await bcrypt.hash(newPassword, 10);
        user.password = hashedPw;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Skip / Donate Ration Feature ---
// Get current month preference
router.get('/ration-preference', async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        let preference = await MonthlyRation.findOne({ user: req.user.id, month: currentMonth });
        
        if (!preference) {
            // Default is collect if not set
            preference = { status: 'collect', month: currentMonth };
        }
        res.json(preference);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update current month preference
router.post('/ration-preference', async (req, res) => {
    try {
        const { status } = req.body; // 'collect' or 'donated'
        const user = await User.findById(req.user.id).populate('shopId');
        
        if (!user || !user.shopId) {
            return res.status(404).json({ message: 'User or Shop not found' });
        }

        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Find existing preference or create a new one
        let preference = await MonthlyRation.findOne({ user: user._id, month: currentMonth });
        
        if (preference) {
            if (preference.status === 'donated' && status === 'collect') {
                return res.status(400).json({ message: 'You have already donated your ration for this month.' });
            }
            preference.status = status;
            await preference.save();
        } else {
            preference = new MonthlyRation({
                user: user._id,
                shopId: user.shopId._id,
                month: currentMonth,
                status: status
            });
            await preference.save();
        }

        // Handle Donation Pool logic
        if (status === 'donated') {
            // Get user's standard ration allocation based on family size
            const items = [
                { commodity: 'rice', quantity: user.familyMembers * 5 }, // 5kg per member
                { commodity: 'wheat', quantity: user.familyMembers * 2 }, // 2kg per member
                { commodity: 'sugar', quantity: 1 } // 1kg base
            ];

            const donation = new Donation({
                donorName: user.name,
                donorType: 'individual',
                items: items,
                assignedType: 'unassigned'
            });
            await donation.save();

            // Notify user
            const notification = new Notification({
                title: 'Ration Donated successfully',
                message: `Thank you for donating your ${currentMonth} ration. Your ration has been added to the donation pool to aid orphanages and old age homes.`,
                type: 'system',
                recipientRole: 'citizen',
                recipientId: user._id
            });
            await notification.save();
        }

        res.json({ message: 'Preference updated successfully', preference });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

