const mongoose = require('mongoose');

const monthlyRationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    month: { type: String, required: true }, // Format: YYYY-MM
    status: { type: String, enum: ['collect', 'donated'], default: 'collect' }
}, { timestamps: true });

// Ensure a user can only have one preference per month
monthlyRationSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyRation', monthlyRationSchema);
