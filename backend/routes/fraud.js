const express = require('express');
const FraudAlert = require('../models/FraudAlert');
const User = require('../models/User');
const router = express.Router();

// Get all fraud alerts
router.get('/', async (req, res) => {
    try {
        const { riskLevel, status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (riskLevel) query.riskLevel = riskLevel;
        if (status) query.status = status;
        const total = await FraudAlert.countDocuments(query);
        const alerts = await FraudAlert.find(query)
            .populate('user', 'name rationCard phone')
            .sort({ detectedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        res.json({ alerts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Review/Flag alert
router.patch('/:id', async (req, res) => {
    try {
        const alert = await FraudAlert.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('user', 'name rationCard');
        // If flagged, also suspend the user
        if (req.body.status === 'flagged' && alert.user) {
            await User.findByIdAndUpdate(alert.user._id, { status: 'suspended' });
        }
        res.json(alert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
