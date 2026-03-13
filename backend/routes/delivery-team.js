const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Middleware: expects req.shopId injected by getShop middleware (from shop-portal.js)
// GET /api/delivery-team — list delivery persons for the shop
router.get('/', async (req, res) => {
    try {
        const members = await Admin.find({ role: 'delivery_person', shop: req.shopId }).select('-password');
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/delivery-team/add — shop admin adds a delivery person
router.post('/add', async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existing = await Admin.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const member = await Admin.create({
            name,
            email,
            password: hashedPassword,
            role: 'delivery_person',
            shop: req.shopId
        });

        res.json({ message: 'Delivery person added', member: { _id: member._id, name: member.name, email: member.email, role: member.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/delivery-team/:id — remove a delivery person
router.delete('/:id', async (req, res) => {
    try {
        const member = await Admin.findOne({ _id: req.params.id, role: 'delivery_person', shop: req.shopId });
        if (!member) return res.status(404).json({ message: 'Delivery person not found' });
        await member.deleteOne();
        res.json({ message: 'Delivery person removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
