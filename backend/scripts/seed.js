const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Shop = require('../models/Shop');
const Stock = require('../models/Stock');
const Order = require('../models/Order');
const Complaint = require('../models/Complaint');
const Admin = require('../models/Admin');

const districts = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'];
const categories = ['AAY', 'PHH', 'NPHH', 'AY'];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Shop.deleteMany({}),
            Stock.deleteMany({}),
            Order.deleteMany({}),
            Complaint.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing collections');

        // 1. Create Shops and Shop Admins
        const shops = [];
        const shopPassword = await bcrypt.hash('shop123', 10);
        for (let i = 1; i <= 10; i++) {
            const district = districts[Math.floor(Math.random() * districts.length)];
            const shop = await Shop.create({
                shopId: `FPS-${1000 + i}`,
                name: `${district} Ration Store #${i}`,
                ownerName: `Owner ${i}`,
                phone: `987654321${i % 10}`,
                address: `${i * 12}, Main St, ${district}`,
                district: district,
                latitude: 10 + Math.random() * 2,
                longitude: 77 + Math.random() * 2,
                usersServed: Math.floor(Math.random() * 500) + 100,
                stock: {
                    rice: Math.floor(Math.random() * 5000) + 500,
                    wheat: Math.floor(Math.random() * 3000) + 300,
                    sugar: Math.floor(Math.random() * 1000) + 100,
                    kerosene: Math.floor(Math.random() * 500) + 50
                }
            });
            shops.push(shop);

            // Create Shop Admin
            const shopEmail = `shop${i}@srms.gov.in`;
            await Admin.create({
                name: `${district} Shop Admin #${i}`,
                email: shopEmail,
                password: shopPassword,
                role: 'shopadmin',
                shop: shop._id
            });
        }
        console.log(`🏠 Created ${shops.length} shops and their admin accounts`);

        // 2. Create Users
        const users = [];
        const userPassword = await bcrypt.hash('user123', 10);
        for (let i = 1; i <= 50; i++) {
            const district = districts[Math.floor(Math.random() * districts.length)];
            const user = await User.create({
                name: `Citizen User ${i}`,
                phone: `887766554${i % 10}`,
                password: userPassword,
                address: `${i * 100}, Cross St, ${district}`,
                rationCard: `TN${1000000 + i}`,
                aadhaar: `1234567890${(i % 100).toString().padStart(2, '0')}`,
                district: district,
                familyMembers: Math.floor(Math.random() * 5) + 1,
                category: categories[Math.floor(Math.random() * categories.length)],
                status: Math.random() > 0.1 ? 'active' : 'suspended'
            });
            users.push(user);
        }
        console.log(`👤 Created ${users.length} users`);

        // 3. Create Orders (Transactions)
        for (let i = 0; i < 150; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const shop = shops[Math.floor(Math.random() * shops.length)];
            await Order.create({
                user: user._id,
                shop: shop._id,
                items: [
                    { commodity: 'rice', quantity: Math.floor(Math.random() * 20) + 5 },
                    { commodity: 'wheat', quantity: Math.floor(Math.random() * 10) + 2 }
                ],
                totalAmount: Math.floor(Math.random() * 200) + 50,
                purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
            });
        }
        console.log('🛒 Created 150 transaction records');

        // 4. Create Complaints
        for (let i = 0; i < 20; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            await Complaint.create({
                user: user._id,
                subject: i % 2 === 0 ? 'Shortage of Rice' : 'Long Waiting Queue',
                message: 'Detailed grievance message regarding ration distribution quality.',
                category: i % 3 === 0 ? 'quality' : 'service',
                status: i % 4 === 0 ? 'resolved' : 'open'
            });
        }
        console.log('📧 Created 20 complaints');

        // 5. Create Monthly Stock Summary
        const now = new Date();
        for (let m = 0; m < 6; m++) {
            const date = new Date(now.getFullYear(), now.getMonth() - m, 1);
            await Stock.create({
                commodity: 'rice',
                totalQuantity: 50000,
                distributed: 35000 + Math.random() * 10000,
                remaining: 5000 + Math.random() * 5000,
                month: date.getMonth() + 1,
                year: date.getFullYear()
            });
            await Stock.create({
                commodity: 'wheat',
                totalQuantity: 30000,
                distributed: 20000 + Math.random() * 5000,
                remaining: 5000,
                month: date.getMonth() + 1,
                year: date.getFullYear()
            });
        }
        console.log('📊 Created 6 months of historical stock data');

        // 6. Create Default Admin if none exists
        const adminEmail = 'admin@srms.gov.in';
        const adminExists = await Admin.findOne({ email: adminEmail });
        if (!adminExists) {
            const hashedPw = await bcrypt.hash('admin123', 10);
            await Admin.create({
                name: 'Super Administrator',
                email: adminEmail,
                password: hashedPw,
                role: 'superadmin'
            });
            console.log('✅ Default Super Admin created: admin@srms.gov.in | admin123');
        } else {
            console.log('ℹ️  Default Super Admin already exists');
        }

        console.log('✨ Seeding completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
};

seedData();
