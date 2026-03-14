const express = require('express');
const router = express.Router();
const RationCardRecord = require('../models/RationCardRecord');

// GET /api/ration-records — list all records with pagination & search
router.get('/', async (req, res) => {
    try {
        const { search = '', page = 1, limit = 20 } = req.query;
        const query = search
            ? { $or: [
                { rationCardNumber: new RegExp(search, 'i') },
                { district: new RegExp(search, 'i') },
                { 'members.name': new RegExp(search, 'i') }
              ] }
            : {};

        const total = await RationCardRecord.countDocuments(query);
        const records = await RationCardRecord.find(query)
            .populate('assignedShop', 'shopId name district')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/ration-records/:id — single record
router.get('/:id', async (req, res) => {
    try {
        const record = await RationCardRecord.findById(req.params.id).populate('assignedShop', 'shopId name');
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/ration-records — add a new record
router.post('/', async (req, res) => {
    try {
        const { rationCardNumber, category, address, district, assignedShop, members } = req.body;

        if (!rationCardNumber || !address || !district || !members?.length) {
            return res.status(400).json({ message: 'rationCardNumber, address, district, and at least one member are required' });
        }

        // Check for duplicate ration card
        const existing = await RationCardRecord.findOne({ rationCardNumber });
        if (existing) return res.status(400).json({ message: 'Ration card number already exists in the database' });

        // Check for duplicate Aadhaar in any record
        const allAadhaarNos = members.map(m => m.aadhaar).filter(Boolean);
        if (allAadhaarNos.length) {
            const aadhaarConflict = await RationCardRecord.findOne({ 'members.aadhaar': { $in: allAadhaarNos } });
            if (aadhaarConflict) return res.status(400).json({ message: `One or more Aadhaar numbers already exist in another ration card record` });
        }

        const record = await RationCardRecord.create({ rationCardNumber, category, address, district, assignedShop: assignedShop || null, members });
        res.status(201).json({ message: 'Record created', record });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/ration-records/:id — update a record
router.put('/:id', async (req, res) => {
    try {
        const { category, address, district, assignedShop, members, registered } = req.body;
        const record = await RationCardRecord.findByIdAndUpdate(
            req.params.id,
            { category, address, district, assignedShop: assignedShop || null, members, registered },
            { new: true, runValidators: true }
        );
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json({ message: 'Record updated', record });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/ration-records/:id
router.delete('/:id', async (req, res) => {
    try {
        const record = await RationCardRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        if (record.registered) return res.status(400).json({ message: 'Cannot delete a record that has a registered user account' });
        await record.deleteOne();
        res.json({ message: 'Record deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/ration-records/bulk — import multiple records at once
router.post('/bulk', async (req, res) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records) || !records.length) return res.status(400).json({ message: 'records array is required' });
        const result = await RationCardRecord.insertMany(records, { ordered: false });
        res.json({ message: `${result.length} records imported`, count: result.length });
    } catch (err) {
        res.status(500).json({ message: err.message, partial: true });
    }
});

module.exports = router;
