const express = require('express');
const router = express.Router();
const DeliveryRequest = require('../models/DeliveryRequest');

// Get delivery requests for a shop
router.get('/:shopId', async (req, res) => {
    try {
        const requests = await DeliveryRequest.find({ shop: req.params.shopId })
            .populate('user', 'name phone rationCard address')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update delivery status
router.patch('/update/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await DeliveryRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
