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
        const { shopId, name, ownerName, phone, address, district, state, latitude, longitude, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and Password are required to create a shop admin account." });
        }

        const Admin = require('../models/Admin');
        const bcrypt = require('bcryptjs');

        // Check if admin email already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "An admin account with this email already exists." });
        }

        const shop = new Shop({
            shopId, name, ownerName, phone, address, district, state, latitude, longitude
        });
        await shop.save();

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({
            name: ownerName || name,
            email,
            password: hashedPassword,
            role: 'shopadmin',
            shop: shop._id
        });
        await newAdmin.save();

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
