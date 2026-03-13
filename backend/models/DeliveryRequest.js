const mongoose = require('mongoose');

const deliveryRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: ['pregnant', 'senior_citizen', 'injured', 'disabled', 'other'], required: true },
    description: { type: String, default: '' },
    certificateUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
    requestDate: { type: Date, default: Date.now },
    reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);
