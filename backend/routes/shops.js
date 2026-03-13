const express = require('express');
const Shop = require('../models/Shop');
const router = express.Router();

// Get all shops
router.get('/', async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { shopId: { $regex: search, $options: 'i' } },
                { district: { $regex: search, $options: 'i' } }
            ];
        }
        const total = await Shop.countDocuments(query);
        const shops = await Shop.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
        res.json({ shops, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new shop
router.post('/', async (req, res) => {
    try {
        const shop = new Shop(req.body);
        await shop.save();
        res.status(201).json(shop);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update shop
router.put('/:id', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(shop);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update shop status
router.patch('/:id/status', async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(shop);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
