const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// Get donations for a shop
router.get('/:shopId', async (req, res) => {
    try {
        const donations = await Donation.find({ shop: req.params.shopId })
            .populate('user', 'name phone rationCard')
            .sort({ createdAt: -1 });
        res.json(donations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update donation status
router.patch('/update/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const donation = await Donation.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(donation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
