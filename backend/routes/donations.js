const express = require('express');
const Donation = require('../models/Donation');
const router = express.Router();

// Get all donations
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (status) query.status = status;
        const total = await Donation.countDocuments(query);
        const donations = await Donation.find(query).sort({ donationDate: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
        res.json({ donations, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Assign donation
router.patch('/:id', async (req, res) => {
    try {
        const update = { assignedTo: req.body.assignedTo, assignedType: req.body.assignedType, status: 'assigned' };
        const donation = await Donation.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(donation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mark as distributed
router.patch('/:id/distribute', async (req, res) => {
    try {
        const donation = await Donation.findByIdAndUpdate(req.params.id, { status: 'distributed' }, { new: true });
        res.json(donation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
