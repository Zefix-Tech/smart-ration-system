const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    items: [{
        commodity: { type: String, enum: ['rice', 'wheat', 'sugar', 'kerosene'] },
        quantity: { type: Number, default: 0 },
        unit: { type: String, default: 'kg' }
    }],
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['completed', 'pending', 'cancelled', 'approved'], default: 'pending' },
    purchaseDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
