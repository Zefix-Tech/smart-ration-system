const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();

// Get all notifications
router.get('/', async (req, res) => {
    try {
        const userId = req.admin?.id || req.user?.id;
        const notifications = await Notification.find().sort({ sentAt: -1 }).limit(50).lean();
        
        const mapped = notifications.map(notif => ({
            ...notif,
            isRead: notif.readBy?.map(id => id.toString()).includes(userId) || false
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

// Create notification (Broadcast)
router.post('/', async (req, res) => {
    try {
        const { title, message, type, priority, targetAudience } = req.body;
        const notification = new Notification({ 
            title, 
            message, 
            type: type || 'announcement', 
            priority: priority || 'normal', 
            targetAudience: targetAudience || 'all',
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
