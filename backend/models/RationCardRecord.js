const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    aadhaar: { type: String, required: true },
    relation: { type: String, enum: ['Head', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other'], default: 'Other' },
    dob: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' }
}, { _id: false });

const rationCardRecordSchema = new mongoose.Schema({
    rationCardNumber: { type: String, required: true, unique: true, index: true },
    category: { type: String, enum: ['AAY', 'PHH', 'NPHH'], default: 'PHH' },
    address: { type: String, required: true },
    district: { type: String, required: true },
    assignedShop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    members: [memberSchema],
    registered: { type: Boolean, default: false } // true once a user account is created from this record
}, { timestamps: true });

// Virtual for family size
rationCardRecordSchema.virtual('familySize').get(function () {
    return this.members.length;
});

module.exports = mongoose.model('RationCardRecord', rationCardRecordSchema);
