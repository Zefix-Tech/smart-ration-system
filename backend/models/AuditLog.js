const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    action: { type: String, required: true }, // e.g., 'CREATE_SHOP', 'SUSPEND_USER'
    module: { type: String, required: true }, // e.g., 'SHOPS', 'USERS'
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
