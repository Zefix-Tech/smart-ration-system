const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const Shop = require('../models/Shop');
const Stock = require('../models/Stock');
const Order = require('../models/Order');
const Complaint = require('../models/Complaint');
const Admin = require('../models/Admin');
const RationCardRecord = require('../models/RationCardRecord');
const DeliveryRequest = require('../models/DeliveryRequest');
const Donation = require('../models/Donation');
const FraudAlert = require('../models/FraudAlert');
const Notification = require('../models/Notification');

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
            Complaint.deleteMany({}),
            Admin.deleteMany({ role: { $in: ['shop_owner', 'delivery_person'] } }),
            RationCardRecord.deleteMany({}),
            DeliveryRequest.deleteMany({}),
            Donation.deleteMany({}),
            FraudAlert.deleteMany({}),
            Notification.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing collections');

        const shopPassword = await bcrypt.hash('shop123', 10);
        const deliveryPassword = await bcrypt.hash('delivery123', 10);
        const userPassword = await bcrypt.hash('user123', 10);

        // 1. Create Shops, Shop Admins and Deliverymen
        const shops = [];
        for (let i = 1; i <= 10; i++) {
            const district = districts[i % districts.length];
            const shop = await Shop.create({
                shopId: `FPS-${1000 + i}`,
                name: `${district} Ration Store #${i}`,
                ownerName: `Owner ${i}`,
                phone: `987654321${i % 10}`,
                address: `${i * 12}, Main St, ${district}`,
                district: district,
                latitude: 10 + Math.random() * 2,
                longitude: 77 + Math.random() * 2,
                usersServed: 0, 
                stock: {
                    rice: 5000,
                    wheat: 3000,
                    sugar: 1000,
                    kerosene: 500
                }
            });
            shops.push(shop);

            // Create Shop Admin
            const shopEmail = `shop${i}@srms.gov.in`;
            await Admin.create({
                name: `${district} Shop Admin #${i}`,
                email: shopEmail,
                password: shopPassword,
                role: 'shop_owner',
                shop: shop._id
            });

            // Create 2 Deliverymen per shop
            for(let j=1; j<=2; j++){
                await Admin.create({
                    name: `Delivery ${j} - Shop ${i}`,
                    email: `delivery${i}-${j}@srms.gov.in`,
                    password: deliveryPassword,
                    role: 'delivery_person',
                    shop: shop._id
                });
            }
        }
        console.log(`🏠 Created ${shops.length} shops with admins and delivery teams`);

        // 2. Create Users (Linked to Shops)
        const users = [];
        for (let i = 1; i <= 50; i++) {
            const assignedShop = shops[i % shops.length];
            const user = await User.create({
                name: `Citizen User ${i}`,
                phone: `88776655${i.toString().padStart(2, '0')}`,
                password: userPassword,
                address: `${i * 100}, Cross St, ${assignedShop.district}`,
                rationCard: `TN${1000000 + i}`,
                aadhaar: `1234567890${(i % 100).toString().padStart(2, '0')}`,
                district: assignedShop.district,
                shopId: assignedShop._id,
                familyMembers: (i % 5) + 1,
                category: categories[i % categories.length],
                status: 'active'
            });
            users.push(user);
            
            // Increment shop membersCount (if tracking on model)
            assignedShop.membersCount = (assignedShop.membersCount || 0) + 1;
            await assignedShop.save();
        }
        console.log(`👤 Created ${users.length} users and linked them to shops`);

        // 3. Create Orders and Delivery Requests
        for (let i = 0; i < 100; i++) {
            const user = users[i % users.length];
            const shop = shops.find(s => s._id.toString() === user.shopId.toString());
            
            const status = i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'pending' : i % 4 === 2 ? 'approved' : 'out_for_delivery';
            
            const order = await Order.create({
                user: user._id,
                shop: shop._id,
                items: [
                    { commodity: 'rice', quantity: user.familyMembers * 5 },
                    { commodity: 'wheat', quantity: user.familyMembers * 2 }
                ],
                totalAmount: (user.familyMembers * 5 * 2) + (user.familyMembers * 2 * 5),
                status: status,
                purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
            });

            // If order is out_for_delivery or approved, create a DeliveryRequest
            if (status === 'out_for_delivery' || (i % 5 === 0)) {
                await DeliveryRequest.create({
                    user: user._id,
                    shop: shop._id,
                    order: order._id,
                    reason: 'senior_citizen',
                    address: user.address,
                    status: status === 'out_for_delivery' ? 'dispatched' : 'approved',
                    requestDate: order.purchaseDate
                });
            }
        }
        console.log('🛒 Created transactional records with delivery interconnections');

        // 4. Create Complaints (Linked to Shops)
        for (let i = 0; i < 20; i++) {
            const user = users[i % users.length];
            await Complaint.create({
                user: user._id,
                shop: user.shopId,
                subject: i % 2 === 0 ? 'Stock Shortage' : 'Delayed Delivery',
                message: 'I have been facing issues with the service at this ration shop.',
                category: i % 3 === 0 ? 'quality' : 'service',
                status: 'open'
            });
        }
        console.log('📧 Created 20 complaints linked to shops');

        // 5. Create Donations
        for (let i = 0; i < 10; i++) {
            const user = users[i % users.length];
            await Donation.create({
                donorName: user.name,
                donorType: 'individual',
                items: [
                    { commodity: 'rice', quantity: 10 },
                    { commodity: 'wheat', quantity: 5 }
                ],
                status: i % 2 === 0 ? 'received' : 'distributed'
            });
        }
        console.log('🎁 Created 10 donation records');

        // 6. Fraud Alerts
        for (let i = 0; i < 5; i++) {
            const user = users[i % users.length];
            await FraudAlert.create({
                user: user._id,
                activityType: i % 2 === 0 ? 'duplicate_request' : 'multiple_purchase',
                description: 'System detected unusual frequency of requests for this user.',
                riskLevel: i % 2 === 0 ? 'medium' : 'high',
                status: 'new'
            });
        }
        console.log('🚩 Created 5 fraud alerts');

        // 7. Notifications
        await Notification.create({
            title: 'Welcome to Smart Ration System',
            message: 'A new digital era of ration distribution has begun.',
            type: 'announcement',
            targetAudience: 'all'
        });
        await Notification.create({
            title: 'New Stock Allocation',
            message: 'New month stock has been allocated to all shops.',
            type: 'stock_update',
            targetAudience: 'shop_owners'
        });

        // 8. Create Government Ration Card Records (for registration validation)
        const rationRecordData = [
            { rationCardNumber: 'TN-RC-001002', category: 'NPHH', address: '45, West Cross, Salem', district: 'Salem', members: [
                { name: 'Karthik S', aadhaar: '345678901234', relation: 'Head', gender: 'Male' }
            ], registered: false },
            { rationCardNumber: 'TN-RC-001001', category: 'PHH', address: '12, Gandhi Nagar, Salem', district: 'Salem', members: [
                { name: 'Murugan K', aadhaar: '234567890123', relation: 'Head', gender: 'Male' },
                { name: 'Priya M', aadhaar: '234567890124', relation: 'Spouse', gender: 'Female' },
                { name: 'Karthik M', aadhaar: '234567890125', relation: 'Son', gender: 'Male' }
            ]},
            { rationCardNumber: 'TN-RC-001002', category: 'AAY', address: '45, Anna Street, Chennai', district: 'Chennai', members: [
                { name: 'Ravi S', aadhaar: '345678901234', relation: 'Head', gender: 'Male' },
                { name: 'Kavitha R', aadhaar: '345678901235', relation: 'Spouse', gender: 'Female' }
            ]},
            { rationCardNumber: 'TN-RC-001003', category: 'PHH', address: '7, Cross Road, Coimbatore', district: 'Coimbatore', members: [
                { name: 'Selvam T', aadhaar: '456789012345', relation: 'Head', gender: 'Male' },
                { name: 'Meena S', aadhaar: '456789012346', relation: 'Spouse', gender: 'Female' },
                { name: 'Anitha S', aadhaar: '456789012347', relation: 'Daughter', gender: 'Female' },
                { name: 'Arun S', aadhaar: '456789012348', relation: 'Son', gender: 'Male' }
            ]}
        ];

        // Link records to actual shop IDs from our seeded shops
        for (let i = 0; i < rationRecordData.length; i++) {
            rationRecordData[i].assignedShop = shops[i % shops.length]._id;
        }

        await RationCardRecord.insertMany(rationRecordData);
        console.log(`📋 Created ${rationRecordData.length} government ration card records for registration demo`);

        console.log('✨ Seeding completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
};

seedData();
