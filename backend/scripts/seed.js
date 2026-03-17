const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Shop = require('../models/Shop');
const Admin = require('../models/Admin');
const RationCardRecord = require('../models/RationCardRecord');
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const DeliveryRequest = require('../models/DeliveryRequest');
const Complaint = require('../models/Complaint');
const Donation = require('../models/Donation');
const FraudAlert = require('../models/FraudAlert');
const Notification = require('../models/Notification');

const districts = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'];
const categories = ['AAY', 'PHH', 'NPHH'];
const firstNames = ['Arun', 'Priya', 'Murugan', 'Kavitha', 'Selvam', 'Meena', 'Karthik', 'Anitha', 'Suresh', 'Deepa', 'Ravi', 'Lakshmi', 'Vijay', 'Shanthi', 'Rajesh', 'Uma', 'Deepak', 'Sangeetha', 'Ganesh', 'Vidya'];
const lastNames = ['K', 'S', 'M', 'T', 'P', 'R', 'A', 'N', 'V', 'J'];

const generateAadhaar = (index) => {
    return `5100${index.toString().padStart(8, '0')}`;
};

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Shop.deleteMany({}),
            Admin.deleteMany({ role: { $ne: 'superadmin' } }),
            RationCardRecord.deleteMany({}),
            Order.deleteMany({}),
            Complaint.deleteMany({}),
            Donation.deleteMany({}),
            FraudAlert.deleteMany({}),
            Notification.deleteMany({}),
            DeliveryRequest.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing collections');

        // Ensure Super Admin status is correct
        const saPw = await bcrypt.hash('shop123', 10);
        await Admin.updateOne(
            { role: 'superadmin' },
            { $set: { password: saPw, email: 'admin@srms.gov.in' } },
            { upsert: true }
        );
        console.log('👑 Super Admin record verified and updated');

        // Drop legacy unique indices if they exist and cause issues
        try { await User.collection.dropIndex('rationCard_1'); } catch (e) {}
        try { await User.collection.dropIndex('phone_1'); } catch (e) {}

        const shopPassword = await bcrypt.hash('shop123', 10);
        const deliveryPassword = await bcrypt.hash('delivery123', 10);

        // 1. Create 10 Shops
        const shops = [];
        for (let i = 0; i < 10; i++) {
            const district = districts[i % districts.length];
            const shop = await Shop.create({
                shopId: `FPS-${1000 + i + 1}`,
                name: `${district} Ration Store #${i + 1}`,
                ownerName: `${firstNames[i]} ${lastNames[i]}`,
                phone: `9876543${i.toString().padStart(3, '0')}`,
                address: `${10 + i}, MK Street, ${district}`,
                district: district,
                latitude: 11.0 + Math.random(),
                longitude: 77.0 + Math.random(),
                stock: {
                    rice: 5000 + Math.floor(Math.random() * 2000),
                    wheat: 3000 + Math.floor(Math.random() * 1000),
                    sugar: 1000 + Math.floor(Math.random() * 500),
                    kerosene: 500 + Math.floor(Math.random() * 200)
                }
            });
            shops.push(shop);

            // Create Shop Owner
            await Admin.create({
                name: shop.ownerName,
                email: `shop${i + 1}@srms.gov.in`,
                password: shopPassword,
                role: 'shop_owner',
                shop: shop._id
            });

            // Create 2 Delivery Persons
            for (let j = 1; j <= 2; j++) {
                await Admin.create({
                    name: `Delivery ${j} - ${shop.shopId}`,
                    email: `delivery${i + 1}-${j}@srms.gov.in`,
                    password: deliveryPassword,
                    role: 'delivery_person',
                    shop: shop._id
                });
            }
        }
        console.log(`🏠 Created ${shops.length} shops with owners and delivery teams`);

        // 2. Create 60 Ration Card Master Records
        const inactiveUsers = [];
        let globalAadhaarIndex = 1;

        const userPassword = await bcrypt.hash('user123', 10);

        for (let i = 0; i < 60; i++) {
            const district = districts[i % districts.length];
            const shop = shops[i % shops.length];
            const rationCardNumber = `TN-RC-${(300000 + i).toString()}`;
            const category = categories[i % categories.length];
            const cardAddress = `${Math.floor(Math.random() * 100) + 1}, Cross St, ${district}`;

            // Exactly one member: The Head
            const name = i < 50 ? `Citizen User ${i + 1}` : `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            const aadhaar = generateAadhaar(2000 + i);
            const relation = 'Head';
            const gender = i % 2 === 0 ? 'Male' : 'Female';

            const members = [{ name, aadhaar, relation, gender, dob: '01/01/1980' }];

            // First 50 Users are PRE-REGISTERED for demo
            const isRegistered = i < 50;
            const phone = isRegistered ? `88776655${(i + 1).toString().padStart(2, '0')}` : null;
            const password = isRegistered ? userPassword : null;
            const status = isRegistered ? 'active' : 'inactive';

            const user = await User.create({
                name,
                aadhaar,
                rationCard: rationCardNumber,
                district,
                address: cardAddress,
                shopId: shop._id,
                familyMembers: 1,
                category,
                status,
                isRegistered,
                phone,
                password,
                registeredAt: isRegistered ? new Date() : null
            });
            inactiveUsers.push(user);

            await RationCardRecord.create({
                rationCardNumber,
                category,
                address: cardAddress,
                district,
                assignedShop: shop._id,
                members,
                registered: isRegistered
            });
        }
        console.log(`📋 Created 60 Ration Records (50 Registered, 10 Inactive)`);

        // 3. Create Transactional Orders
        const orderStatuses = ['completed', 'pending', 'approved', 'out_for_delivery', 'delivered'];
        for (let i = 0; i < 30; i++) {
            const user = inactiveUsers[i % inactiveUsers.length];
            const shop = shops[i % shops.length];
            const status = orderStatuses[i % orderStatuses.length];
            
            const order = await Order.create({
                user: user._id,
                shop: shop._id,
                items: [
                    { commodity: 'rice', quantity: 15 + (i % 10), unit: 'kg' },
                    { commodity: 'wheat', quantity: 5 + (i % 5), unit: 'kg' }
                ],
                totalAmount: 100 + (i * 10),
                status: status,
                otp: (100000 + i).toString(),
                otpExpiry: new Date(Date.now() + 86400000)
            });

            // Delivery Requests
            if (i % 6 === 0) {
                await DeliveryRequest.create({
                    user: user._id,
                    shop: shop._id,
                    order: order._id,
                    reason: i % 2 === 0 ? 'senior_citizen' : 'disabled',
                    address: user.address,
                    status: status === 'delivered' ? 'delivered' : 'pending'
                });
            }

            // Complaints
            if (i % 12 === 0) {
                await Complaint.create({
                    user: user._id,
                    shop: shop._id,
                    subject: 'Stock Availability',
                    message: 'When will sugar be available?',
                    category: 'service',
                    status: 'open'
                });
            }

            // Fraud Alerts
            if (i === 5 || i === 25) {
                await FraudAlert.create({
                    user: user._id,
                    activityType: 'multiple_purchase',
                    description: 'Suspiciously frequent purchase attempts.',
                    riskLevel: 'high'
                });
            }
        }
        console.log('🛒 Generated 60 Orders and associated transactional data');

        // 7. Add Donations
        for (let i = 0; i < 5; i++) {
            await Donation.create({
                donorName: `Donor ${i + 1}`,
                donorType: 'individual',
                items: [{ commodity: 'rice', quantity: 50, unit: 'kg' }],
                status: 'received'
            });
        }
        console.log('🎁 Created 5 donation records');

        // 8. Add Notifications
        await Notification.create({
            title: 'System Ready',
            message: 'Masters data seeded. Use Aadhaar and Ration Card to register.',
            type: 'announcement',
            recipientRole: 'all'
        });

        console.log('✨ SEEDING COMPLETED SUCCESSFULLY');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
};

seedData();
