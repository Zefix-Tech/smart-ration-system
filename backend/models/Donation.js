const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donorName: { type: String, required: true },
    donorType: { type: String, enum: ['individual', 'organization', 'government'], default: 'individual' },
    items: [{
        commodity: { type: String, enum: ['rice', 'wheat', 'sugar', 'clothing', 'other'] },
        quantity: { type: Number, default: 0 },
        unit: { type: String, default: 'kg' }
    }],
    assignedTo: { type: String, default: '' },
    assignedType: { type: String, enum: ['ngo', 'orphanage', 'old_age_home', 'unassigned'], default: 'unassigned' },
    status: { type: String, enum: ['received', 'assigned', 'distributed'], default: 'received' },
    donationDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
