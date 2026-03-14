const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Hospital Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, hospitalId } = req.body;
        console.log(`[Hospital] Login attempt for ${email} (${hospitalId})`);
        const hospital = await Hospital.findOne({ email, hospitalId });
        if (!hospital) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, hospital.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        hospital.lastLogin = new Date();
        await hospital.save();

        const token = jwt.sign(
            { id: hospital._id, email: hospital.email, role: 'HOSPITAL_VERIFIER', name: hospital.hospitalName },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true,
            token, 
            hospital: { id: hospital._id, name: hospital.hospitalName, email: hospital.email, hospitalId: hospital.hospitalId }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Protect all following routes
router.use(auth);

// Get pending verifications for citizens
router.get('/pending-verifications', async (req, res) => {
    try {
        console.log(`[Hospital] Fetching pending verifications`);
        const pending = await User.find({ 
            eligibilityStatus: 'PENDING',
            eligibilityType: { $ne: 'None' }
        }).select('name eligibilityType eligibilityDocumentUrl registeredAt eligibilityReason');
        res.json(pending);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get verification history (already processed)
router.get('/verification-history', async (req, res) => {
    try {
        console.log(`[Hospital] Fetching verification history`);
        const history = await User.find({ 
            eligibilityStatus: { $in: ['Hospital Verified', 'Hospital Rejected', 'VERIFIED', 'REJECTED'] }
        }).select('name eligibilityType eligibilityDocumentUrl updatedAt eligibilityStatus eligibilityReason')
        .sort({ updatedAt: -1 });
        console.log(`[Hospital] Found ${history.length} history records`);
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Hospital Verify Action
router.patch('/verify/:id', async (req, res) => {
    try {
        const { status } = req.body; // 'Hospital Verified' or 'Hospital Rejected'
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Citizen not found' });

        if (status === 'Hospital Verified') {
            user.eligibilityStatus = 'Hospital Verified';
            user.hospitalVerified = true;
            
            // Notify Admin
            const adminNotification = new Notification({
                title: 'Medical Certificate Verified by Hospital',
                message: `The medical certificate for ${user.name} has been verified by the hospital. Awaiting final admin approval.`,
                type: 'alert',
                recipientRole: 'admin',
                priority: 'normal'
            });
            await adminNotification.save();
        } else if (status === 'Hospital Rejected') {
            user.eligibilityStatus = 'Hospital Rejected';
            user.hospitalVerified = false;
            
            // Notify Citizen
            const citizenNotification = new Notification({
                title: 'Hospital Verification Failed',
                message: `Your medical certificate was rejected by the hospital. Please upload a valid certificate.`,
                type: 'alert',
                recipientRole: 'citizen',
                recipientId: user._id,
                priority: 'high'
            });
            await citizenNotification.save();
        } else {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await user.save();
        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
