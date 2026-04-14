const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['stock_update', 'announcement', 'alert', 'maintenance', 'delivery_otp', 'system', 'purchase_approved', 'delivery_update'], 
        default: 'announcement' 
    },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    recipientRole: { 
        type: String, 
        enum: ['admin', 'citizen', 'shop', 'all'], 
        default: 'citizen' 
    },
    recipientId: { type: mongoose.Schema.Types.ObjectId }, // Individual targeting
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }, // Shop-wide targeting
    targetAudience: { type: String, enum: ['all', 'shop_owners', 'users', 'admin', 'specific'], default: 'specific' }, // Legacy support
    readBy: [{ type: mongoose.Schema.Types.ObjectId }], 
    sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
