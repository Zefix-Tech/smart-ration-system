const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();

// Get Admin notifications
router.get('/admin', async (req, res) => {
    try {
        if (!req.admin) return res.status(403).json({ message: 'Access denied' });
        
        const userId = req.admin.id;
        // Admin sees direct messages AND broad announcements (Global)
        const notifications = await Notification.find({ 
            $or: [
                { recipientRole: 'admin' },
                { recipientRole: 'all' },
                { targetAudience: 'all' },
                { targetAudience: 'admin' }
            ]
        }).sort({ sentAt: -1 }).limit(50).lean();
        
        const mapped = notifications.map(notif => ({
            ...notif,
            isRead: notif.readBy?.some(id => id.toString() === userId) || false
        }));
        
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Citizen notifications
router.get('/citizen', async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ 
            $or: [
                { recipientRole: 'all' },
                { recipientRole: 'citizen', recipientId: userId },
                { recipientRole: 'citizen', shopId: { $exists: false }, recipientId: { $exists: false } },
                { targetAudience: 'all' },
                { targetAudience: 'users' }
            ]
        }).sort({ sentAt: -1 }).limit(50).lean();
        
        const mapped = notifications.map(notif => ({
            ...notif,
            isRead: notif.readBy?.some(id => id.toString() === userId) || false
        }));
        
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Shop notifications
router.get('/shop', async (req, res) => {
    try {
        const adminId = req.admin?.id || req.user?.id;
        let shopId = req.shopId;
        
        // If shopId is missing (e.g. from general notifications route), fetch it
        if (!shopId && req.admin?.id) {
            const Admin = require('../models/Admin');
            const admin = await Admin.findById(req.admin.id).populate('shop');
            shopId = admin?.shop?._id;
        }
        
        if (!shopId) return res.status(400).json({ message: 'Shop ID not found in session or no shop associated' });

        const notifications = await Notification.find({ 
            $or: [
                { recipientRole: 'all' },
                { targetAudience: 'all' },
                { targetAudience: 'shop_owners' },
                { recipientRole: 'shop', shopId: shopId },
                { recipientRole: 'shop', shopId: { $exists: false } } // Broad shop announcements
            ]
        }).sort({ sentAt: -1 }).limit(50).lean();
        
        // Role-based filtering: Delivery persons only see delivery updates
        const role = req.admin?.role || 'shop_owner';
        const filtered = role === 'delivery_person' 
            ? notifications.filter(n => ['delivery_update', 'delivery_otp'].includes(n.type))
            : notifications;
        
        const mapped = filtered.map(notif => ({
            ...notif,
            isRead: notif.readBy?.some(id => id.toString() === adminId) || false
        }));
        
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark notifications as read
router.post('/mark-read', async (req, res) => {
    try {
        const { notificationIds } = req.body;
        const userId = req.admin?.id || req.user?.id;
        
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ message: 'Invalid payload' });
        }
        
        await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $addToSet: { readBy: userId } }
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create notification
router.post('/', async (req, res) => {
    try {
        const { title, message, type, priority, recipientRole, recipientId, shopId, targetAudience } = req.body;
        
        // Map targetAudience to recipientRole if provided
        let mappedRole = recipientRole || 'admin';
        if (targetAudience === 'all') mappedRole = 'all';
        else if (targetAudience === 'users') mappedRole = 'citizen';
        else if (targetAudience === 'shop_owners') mappedRole = 'shop';
        else if (targetAudience === 'admin') mappedRole = 'admin';

        const notification = new Notification({ 
            title, 
            message, 
            type: type || 'announcement', 
            priority: priority || 'normal', 
            recipientRole: mappedRole,
            targetAudience: targetAudience || (mappedRole === 'all' ? 'all' : 'specific'),
            recipientId,
            shopId,
            sentBy: req.admin?.id 
        });
        await notification.save();
        res.status(201).json(notification);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
