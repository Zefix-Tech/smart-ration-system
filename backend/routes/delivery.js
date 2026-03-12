const express = require('express');
const DeliveryRequest = require('../models/DeliveryRequest');
const router = express.Router();

// Get all delivery requests
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (status) query.status = status;
        const total = await DeliveryRequest.countDocuments(query);
        const requests = await DeliveryRequest.find(query)
            .populate('user', 'name phone rationCard address age pregnancyStatus disabilityStatus medicalCondition')
            .sort({ requestDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        res.json({ requests, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create delivery request
router.post('/', async (req, res) => {
    try {
        const { userId, reason, description, address } = req.body;
        const newRequest = new DeliveryRequest({
            user: userId,
            reason,
            description,
            address,
            status: 'pending'
        });
        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve/Reject request
router.patch('/:id', async (req, res) => {
    try {
        const update = { status: req.body.status, adminNote: req.body.adminNote || '', reviewedAt: new Date() };
        const request = await DeliveryRequest.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'name phone rationCard');
        res.json(request);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
