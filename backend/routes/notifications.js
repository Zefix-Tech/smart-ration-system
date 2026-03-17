const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();

// Get Admin notifications
router.get('/admin', async (req, res) => {
    try {
        if (!req.admin) return res.status(403).json({ message: 'Access denied' });
        
        const userId = req.admin.id;
        const notifications = await Notification.find({ 
            recipientRole: 'admin' 
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
        const shopId = req.shopId;
        
        if (!shopId) return res.status(400).json({ message: 'Shop ID not found in session' });

        const notifications = await Notification.find({ 
            recipientRole: 'shop',
            shopId: shopId
        }).sort({ sentAt: -1 }).limit(50).lean();
        
        const mapped = notifications.map(notif => ({
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
        const { title, message, type, priority, recipientRole, recipientId, shopId } = req.body;
        
        const notification = new Notification({ 
            title, 
            message, 
            type: type || 'announcement', 
            priority: priority || 'normal', 
            recipientRole: recipientRole || 'admin',
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
