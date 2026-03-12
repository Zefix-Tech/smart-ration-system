const mongoose = require('express');

// Create a static list route for orphanages 
const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

router.get('/orphanages', async (req, res) => {
    // Return sample orphanages since there isn't a complex model required
    res.json([
        { _id: 'org001', name: 'Hope Orphanage', location: 'Chennai' },
        { _id: 'org002', name: 'Sunshine Home', location: 'Madurai' },
        { _id: 'org003', name: 'Care Foundation', location: 'Coimbatore' },
        { _id: 'org004', name: 'Little Angels', location: 'Trichy' }
    ]);
});

router.post('/donations/assign', async (req, res) => {
    try {
        const { donationId, orphanageId } = req.body;
        
        let assignedName = orphanageId;
        const orgs = { org001: 'Hope Orphanage', org002: 'Sunshine Home', org003: 'Care Foundation', org004: 'Little Angels' };
        if (orgs[orphanageId]) assignedName = orgs[orphanageId];

        const donation = await Donation.findByIdAndUpdate(donationId, {
            status: 'assigned',
            assignedTo: assignedName,
            assignedType: 'orphanage'
        }, { new: true });

        res.json({ success: true, donation });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
