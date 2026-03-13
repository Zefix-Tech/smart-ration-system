const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['stock_update', 'announcement', 'alert', 'maintenance'], default: 'announcement' },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    targetAudience: { type: String, enum: ['all', 'shop_owners', 'users', 'specific'], default: 'all' },
    recipients: [{ type: mongoose.Schema.Types.ObjectId }], // Specific target IDs
    readBy: [{ type: mongoose.Schema.Types.ObjectId }], // Users/Admins who have seen it
    sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
