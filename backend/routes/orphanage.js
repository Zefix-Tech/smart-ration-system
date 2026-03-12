const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// GET /api/orphanage/donations
// Note: In a real app we'd authenticate the orphanage login token, but for now we'll return all assigned.
router.get('/donations', async (req, res) => {
    try {
        const donations = await Donation.find({ status: 'assigned', assignedType: 'orphanage' })
                                        .sort({ updatedAt: -1 });
        res.json(donations);
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
