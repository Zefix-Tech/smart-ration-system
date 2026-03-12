const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Notification = require('../models/Notification');
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Citizen: Upload document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No document uploaded' });
        }

        const { eligibilityType, reason } = req.body;
        const documentUrl = `/uploads/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                eligibilityDocumentUrl: documentUrl,
                eligibilityStatus: 'PENDING',
                eligibilityType: eligibilityType || 'None',
                eligibilityReason: reason || ''
            },
            { new: true }
        ).select('-password');
        
        res.json({ message: 'Document uploaded successfully', user });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get all eligibility requests
router.get('/admin/requests', async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        
        const { status = 'PENDING' } = req.query;
        // Find users with non-NONE eligibilityStatus
        const users = await User.find({ eligibilityStatus: status }).select('-password').sort({ updatedAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Verify/Reject eligibility
router.put('/admin/verify/:id', async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { status } = req.body; // 'VERIFIED' or 'REJECTED'
        if (!['VERIFIED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { eligibilityStatus: status },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Dispatch Notification
        const isApproved = status === 'VERIFIED';
        const notification = new Notification({
            title: isApproved ? 'Eligibility Verified' : 'Eligibility Rejected',
            message: isApproved 
                ? 'Your uploaded documents have been verified. You can now use the Home Delivery feature.'
                : 'Your uploaded document was rejected. Please upload a clear, valid certificate for Home Delivery.',
            type: 'alert',
            targetAudience: 'specific',
            recipients: [user._id]
        });
        await notification.save();

        res.json({ message: `Eligibility marked as ${status}`, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
