const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    hospitalName: { type: String, required: true },
    hospitalId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'HOSPITAL_VERIFIER' },
    lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
