const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');
const RationCardRecord = require('../models/RationCardRecord');
const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, aadhaar, rationCard, phone, address, password, cityId } = req.body;
        const shopId = req.body.shopId && req.body.shopId !== '' ? req.body.shopId : undefined;

        // Aadhaar format check
        if (!/^\d{12}$/.test(aadhaar)) {
            return res.status(400).json({ message: 'Invalid Aadhaar Number (must be 12 digits)' });
        }

        // ─── Step 1: Validate against Government Ration Card Record ───
        const govRecord = await RationCardRecord.findOne({ rationCardNumber: rationCard });
        if (!govRecord) {
            return res.status(400).json({ message: 'Ration card not found in government database. Please contact your local office.' });
        }
        if (govRecord.isRegistered) {
            return res.status(400).json({ message: 'A user account already exists for this ration card number.' });
        }

        // Check if the entered Aadhaar belongs to any family member in that record
        const memberMatch = govRecord.members.find(m => m.aadhaar === aadhaar);
        if (!memberMatch) {
            return res.status(400).json({ message: 'Aadhaar number does not match any family member on this ration card.' });
        }
        // ─────────────────────────────────────────────────────────────

        // Step 2: Uniqueness check (phone)
        const existingUser = await User.findOne({ $or: [{ phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this phone number already exists.' });
        }

        // Step 3: Check Shop Capacity
        if (shopId) {
            const shop = await Shop.findById(shopId);
            if (!shop) return res.status(404).json({ message: 'Shop not found' });
            if (shop.membersCount >= 30) {
                return res.status(400).json({ message: 'This shop is already at full capacity (Max 30 members)' });
            }
            shop.membersCount += 1;
            await shop.save();
        }

        // Step 4: Create user — auto-fill from government record
        const hashedPw = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            aadhaar,
            rationCard,
            phone,
            address,
            password: hashedPw,
            cityId,
            shopId,
            role: 'user',
            familyMembers: govRecord.members.length, // auto from record
            category: govRecord.category,            // auto from record
            district: govRecord.district             // auto from record
        });
        await user.save();

        // Step 5: Mark government record as registered
        govRecord.isRegistered = true;
        await govRecord.save();

        res.status(201).json({ success: true, message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login User

router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone }).populate('shopId');
        if (!user) return res.status(400).json({ message: 'Invalid phone or password' });

        const isMatch = await bcrypt.compare(password, user.password);
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
