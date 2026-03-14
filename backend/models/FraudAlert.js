const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Optional for registration attempts
    activityType: { type: String, enum: ['duplicate_request', 'multiple_purchase', 'abnormal_stock', 'identity_mismatch', 'location_anomaly', 'registration_fraud'], required: true },
    description: { type: String, default: '' },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high' }, // Default high for registration fraud
    status: { type: String, enum: ['new', 'reviewed', 'flagged', 'dismissed'], default: 'new' },
    detectedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
