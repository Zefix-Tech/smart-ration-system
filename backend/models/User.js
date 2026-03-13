const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    password: { type: String, required: true }, // Added for Login
    rationCard: { type: String, required: true, unique: true },
    aadhaar: { type: String, required: true }, // Made required
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
    eligibilityType: { type: String, enum: ['Pregnant Woman', 'Senior Citizen (60+)', 'Permanently Disabled', 'Medical Condition', 'None'], default: 'None' },
    eligibilityReason: { type: String, default: '' },
    eligibilityDocumentUrl: { type: String, default: '' },
    eligibilityStatus: { type: String, enum: ['NONE', 'PENDING', 'VERIFIED', 'REJECTED'], default: 'NONE' },
    registeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
