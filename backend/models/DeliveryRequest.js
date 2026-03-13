const mongoose = require('mongoose');

const deliveryRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: ['pregnant', 'senior_citizen', 'injured', 'disabled', 'osteogenesis_imperfecta', 'other'], required: true },
    description: { type: String, default: '' },
    certificateUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'dispatched', 'delivered'], default: 'pending' },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    adminNote: { type: String, default: '' },
    requestDate: { type: Date, default: Date.now },
    reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);
