const express = require('express');
const AuditLog = require('../models/AuditLog');
const router = express.Router();

// Get all audit logs
router.get('/', async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate('admin', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
