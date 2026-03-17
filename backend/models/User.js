const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: null },
    password: { type: String, default: null }, 
    rationCard: { type: String, required: true },
    aadhaar: { type: String, required: true, unique: true }, // Aadhaar must be unique per person
    address: { type: String, required: true }, // Made required
    district: { type: String, default: '' },
    cityId: { type: String, default: '' }, // For city selection
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }, // Link to shop
    state: { type: String, default: 'Tamil Nadu' },
    role: { type: String, default: 'user' }, // Role identification
    familyMembers: { type: Number, default: 1 },
    category: { type: String, enum: ['AAY', 'PHH', 'NPHH', 'AY'], default: 'PHH' },
    status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
    avatar: { type: String, default: '' },
    lastPurchaseDate: { type: Date, default: null },
    eligibilityType: { type: String, enum: ['Pregnant Woman', 'Senior Citizen (60+)', 'Permanently Disabled', 'Medically Eligible', 'Osteogenesis Imperfecta (Bone Disorder)', 'None'], default: 'None' },
    eligibilityReason: { type: String, default: '' },
    eligibilityDocumentUrl: { type: String, default: '' },
    eligibilityStatus: { 
        type: String, 
        enum: ['NONE', 'PENDING', 'Hospital Verified', 'Hospital Rejected', 'VERIFIED', 'REJECTED'], 
        default: 'NONE' 
    },
    hospitalVerified: { type: Boolean, default: false },
    adminApproved: { type: Boolean, default: false },
    aiVerificationStatus: { type: String, enum: ['AI_VERIFIED', 'AI_REJECTED', 'PENDING_REVIEW'], default: 'PENDING_REVIEW' },
    aiConfidenceScore: { type: Number }, // Removed default: 0
    aiPredictedEligibility: { type: String, default: '' },
    detectedKeywords: { type: [String], default: [] },
    isRegistered: { type: Boolean, default: false },
    registeredAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
