const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shopId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    ownerName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    district: { type: String, default: '' },
    state: { type: String, default: 'Tamil Nadu' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    membersCount: { type: Number, default: 0, max: 30 }, // Added 30 members restriction
    usersServed: { type: Number, default: 0 },
    stock: {
        rice: { type: Number, default: 0 },
        wheat: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 },
        kerosene: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
