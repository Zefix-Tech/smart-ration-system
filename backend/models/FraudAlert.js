const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activityType: { type: String, enum: ['duplicate_request', 'multiple_purchase', 'abnormal_stock', 'identity_mismatch', 'location_anomaly'], required: true },
    description: { type: String, default: '' },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['new', 'reviewed', 'flagged', 'dismissed'], default: 'new' },
    detectedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
