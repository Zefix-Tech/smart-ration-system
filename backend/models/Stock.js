const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: false },
    commodity: { type: String, required: true, enum: ['rice', 'wheat', 'sugar', 'kerosene'] },
    totalQuantity: { type: Number, default: 0 },
    distributed: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    unit: { type: String, default: 'kg' },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
