const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });
const Admin = require('./models/Admin');

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'admin@srms.gov.in';
        const password = 'admin123';

        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log('❌ Admin not found');
            process.exit(1);
        }

        console.log('👤 Admin found:', admin.email);
        console.log('🛡️  Stored Hashed Password:', admin.password);

        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password does NOT match');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

testLogin();
