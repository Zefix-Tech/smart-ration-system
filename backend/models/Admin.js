const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'shop_owner', enum: ['superadmin', 'admin', 'shop_owner', 'delivery_person'] },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  avatar: { type: String, default: '' },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
