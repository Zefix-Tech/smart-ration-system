const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');
const RationCardRecord = require('../models/RationCardRecord');
const router = express.Router();

// Register User (Claim existing record)
router.post('/register', async (req, res) => {
    try {
        const { name, aadhaar, rationCard, phone, address, password, cityId } = req.body;
        const shopId = req.body.shopId && req.body.shopId !== '' ? req.body.shopId : undefined;

        // ─── PART 1 & 2: STRICT FORMAT VALIDATION ───
        const rationRegex = /^[A-Z]{2}[0-9]{8}$|^TN-RC-[0-9]{6}$/; // Support both old and new formats
        const aadhaarRegex = /^[0-9]{12}$/;

        if (!rationRegex.test(rationCard) || !aadhaarRegex.test(aadhaar)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid document formats. Registration rejected.' 
            });
        }

        // ─── Step 1: Validate against Government Ration Card Record ───
        const govRecord = await RationCardRecord.findOne({ rationCardNumber: rationCard });
        if (!govRecord) {
            return res.status(400).json({ message: 'Ration card not found in government database.' });
        }

        // ─── Step 2: Find the pre-seeded user record ───
        const existingUser = await User.findOne({ aadhaar, rationCard });
        if (!existingUser) {
            return res.status(400).json({ message: 'No pre-seeded record found for this Aadhaar and Ration Card.' });
        }

        if (existingUser.isRegistered) {
            return res.status(400).json({ message: 'This account is already registered.' });
        }

        // ─── Step 3: Check Phone/Aadhaar duplication elsewhere ───
        const phoneDuplicate = await User.findOne({ phone, isRegistered: true });
        if (phoneDuplicate) return res.status(400).json({ message: 'Phone number already in use.' });

        // ─── Step 4: Update and Claim the Record ───
        const hashedPw = await bcrypt.hash(password, 10);
        
        existingUser.name = name; // Update name if provided
        existingUser.phone = phone;
        existingUser.password = hashedPw;
        existingUser.address = address;
        existingUser.cityId = cityId;
        existingUser.shopId = shopId || existingUser.shopId;
        existingUser.status = 'active';
        existingUser.isRegistered = true;
        existingUser.registeredAt = new Date();

        await existingUser.save();

        // Sync Gov Record
        govRecord.registered = true;
        await govRecord.save();

        res.status(201).json({ success: true, message: 'Registration successful! You can now login.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login User

router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        console.log(`[Login Attempt] Phone: ${phone}`);
        
        const user = await User.findOne({ phone }).populate('shopId');
        if (!user) {
            console.log(`[Login Failed] User not found for phone: ${phone}`);
            return res.status(400).json({ message: 'Invalid phone or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`[Login Debug] Password Match: ${isMatch}`);
        
        if (!isMatch) return res.status(400).json({ message: 'Invalid phone or password' });

        const token = jwt.sign(
            { id: user._id, phone: user.phone, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true,
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                phone: user.phone, 
                role: user.role,
                shop: user.shopId 
            } 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Cities (Dummy list for now)
router.get('/cities', async (req, res) => {
    const cities = [
        { id: 'salem', name: 'Salem' },
        { id: 'chennai', name: 'Chennai' },
        { id: 'coimbatore', name: 'Coimbatore' },
        { id: 'madurai', name: 'Madurai' }
    ];
    res.json(cities);
});

// Get Shops by City
router.get('/shops/:cityId', async (req, res) => {
    try {
        const shops = await Shop.find({ district: new RegExp(req.params.cityId, 'i') });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
