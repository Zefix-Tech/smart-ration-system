const express = require('express');
const Complaint = require('../models/Complaint');
const router = express.Router();

// Get all complaints
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (status) query.status = status;
        const total = await Complaint.countDocuments(query);
        const complaints = await Complaint.find(query)
            .populate('user', 'name phone rationCard')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        res.json({ complaints, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Respond to complaint
router.patch('/:id', async (req, res) => {
    try {
        const update = { adminResponse: req.body.adminResponse, status: req.body.status };
        if (req.body.status === 'resolved') update.resolvedAt = new Date();
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'name phone');
        res.json(complaint);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
