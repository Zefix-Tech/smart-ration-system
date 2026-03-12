const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// Get complaints for a shop
router.get('/:shopId', async (req, res) => {
    try {
        const complaints = await Complaint.find({ shop: req.params.shopId })
            .populate('user', 'name phone rationCard')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Resolve complaint
router.patch('/resolve/:id', async (req, res) => {
    try {
        const { response } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, 
            { status: 'resolved', response }, 
            { new: true }
        );
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
