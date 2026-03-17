const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Notification = require('../models/Notification');
const router = express.Router();

// Ensure uploads directory structure exists
const pendingDir = path.join(__dirname, '../uploads/pending-certificates');
const verifiedDir = path.join(__dirname, '../uploads/verified-certificates');

if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });
if (!fs.existsSync(verifiedDir)) fs.mkdirSync(verifiedDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, pendingDir);
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

const axios = require('axios');
const FormData = require('form-data');

// Citizen: Upload document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No document uploaded' });
        }

        const { eligibilityType, reason } = req.body;
        const documentUrl = `/uploads/pending-certificates/${req.file.filename}`;
        
        // Initial user update with PENDING status
        let user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                eligibilityDocumentUrl: documentUrl,
                eligibilityStatus: 'PENDING',
                eligibilityType: eligibilityType || 'None',
                eligibilityReason: reason || '',
                aiVerificationStatus: 'PENDING_REVIEW',
                aiConfidenceScore: 0,
                aiPredictedEligibility: ''
            },
            { new: true }
        ).select('-password');

        // Trigger AI Verification (Background-ish but wait for result for response if possible)
        try {
            const formData = new FormData();
            formData.append('document', fs.createReadStream(req.file.path));
            formData.append('eligibilityType', eligibilityType || 'None');

            const mlRes = await axios.post('http://localhost:6000/verify-certificate', formData, {
                headers: { ...formData.getHeaders() }
            });

            const { status, confidence, detectedKeywords } = mlRes.data;
            const confidenceScore = Math.round(confidence * 100);

            // Updated User with AI results
            user = await User.findByIdAndUpdate(
                req.user.id,
                { 
                    aiVerificationStatus: status,
                    aiConfidenceScore: confidenceScore,
                    detectedKeywords: detectedKeywords || []
                },
                { new: true }
            ).select('-password');

        } catch (mlErr) {
            console.error('AI Verification failed:', mlErr.message);
            // We still proceed with the upload, manual verification will be needed
        }
        
        res.json({ message: 'Document uploaded and AI verification processed', user });
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
        
        const { status = 'Hospital Verified' } = req.query;
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

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (status === 'VERIFIED' && !user.hospitalVerified) {
            return res.status(400).json({ message: 'Cannot approve: Hospital verification is required first.' });
        }

        const oldPath = user.eligibilityDocumentUrl;
        let finalDocumentUrl = oldPath;

        if (status === 'VERIFIED') {
            if (oldPath && oldPath.includes('pending-certificates')) {
                const fileName = path.basename(oldPath);
                const sourcePath = path.join(__dirname, '..', oldPath);
                const destPath = path.join(verifiedDir, fileName);

                try {
                    if (fs.existsSync(sourcePath)) {
                        fs.renameSync(sourcePath, destPath);
                        finalDocumentUrl = `/uploads/verified-certificates/${fileName}`;
                    }
                } catch (moveErr) {
                    console.error('File move failed:', moveErr);
                }
            }
        } else if (status === 'REJECTED') {
            if (oldPath) {
                const sourcePath = path.join(__dirname, '..', oldPath);
                try {
                    if (fs.existsSync(sourcePath)) {
                        fs.unlinkSync(sourcePath);
                    }
                } catch (unlinkErr) {
                    console.error('File deletion failed:', unlinkErr);
                }
            }
            finalDocumentUrl = ''; // Clear document URL on rejection
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { 
                eligibilityStatus: status,
                eligibilityDocumentUrl: finalDocumentUrl,
                adminApproved: status === 'VERIFIED'
            },
            { new: true }
        ).select('-password');

        // Dispatch Notification
        const isApproved = status === 'VERIFIED';
        const notification = new Notification({
            title: isApproved ? 'Eligibility Verified' : 'Eligibility Rejected',
            message: isApproved 
                ? 'Your medical certificate has been verified successfully. You can now use the Home Delivery feature.'
                : 'Your medical certificate was rejected. Please upload a valid certificate for Home Delivery.',
            type: 'alert',
            recipientRole: 'citizen',
            recipientId: user._id
        });
        await notification.save();

        res.json({ 
            message: isApproved 
                ? 'Eligibility verified and certificate moved to verified storage.' 
                : 'Eligibility rejected and certificate removed from storage.', 
            user: updatedUser 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
