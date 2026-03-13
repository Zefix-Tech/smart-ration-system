const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

// Get users who haven't purchased this month
router.get('/pending-users/:shopId', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Find users in this district (or associated with this shop)
        // For simplicity, let's assume users can visit any shop in their district
        // or we filter by those who haven't ordered from this shop's district
        const users = await User.find({ status: 'active' }).select('name phone rationCard district category lastPurchaseDate');
        
        // Filter those who haven't purchased this month
        const pendingUsers = users.filter(u => !u.lastPurchaseDate || u.lastPurchaseDate < startOfMonth);
        
        res.json(pendingUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Broadcast "Shop Empty" notification
router.post('/broadcast', async (req, res) => {
    try {
        const { userIds, message, shopName } = req.body;
        
        const notifications = userIds.map(userId => ({
            user: userId,
            title: 'Shop is Free for Collection',
            message: `Smart Ration System Notification\n\nDear User,\nThe ration shop (${shopName}) is currently free. You can visit now to collect your ration items.\n\nThank you.`,
            type: 'announcement',
            priority: 'normal'
        }));

        await Notification.insertMany(notifications);
        
        res.json({ message: `Notification sent to ${userIds.length} users successfully.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
