require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const Hospital = require('./models/Hospital');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import auth and audit middleware
const { auth, superAdminOnly } = require('./middleware/auth');
const { logAudit } = require('./middleware/audit');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/auth'));
app.use('/api/shop', require('./routes/auth'));
app.use('/api/auth/user', require('./routes/user-auth'));
app.use('/api/user-portal', auth, require('./routes/user-portal'));
app.use('/api/citizen', auth, require('./routes/user-portal'));
app.use('/api/dashboard', auth, require('./routes/dashboard'));
app.use('/api/users', auth, logAudit('MANAGE_USERS', 'USERS'), require('./routes/users'));
app.use('/api/shops', auth, logAudit('MANAGE_SHOPS', 'SHOPS'), require('./routes/shops'));
app.use('/api/stock', auth, logAudit('UPDATE_STOCK', 'STOCK'), require('./routes/stock'));
app.use('/api/shop-stock', auth, require('./routes/shop-stock'));
app.use('/api/shop-purchases', auth, require('./routes/shop-purchases'));
app.use('/api/shop-delivery', auth, require('./routes/shop-delivery'));
app.use('/api/shop-complaints', auth, require('./routes/shop-complaints'));
app.use('/api/shop-donations', auth, require('./routes/shop-donations'));
app.use('/api/shop-notifications', auth, require('./routes/shop-notifications'));
app.use('/api/shop-reports', auth, require('./routes/shop-reports'));
app.use('/api/delivery', auth, logAudit('VERIFY_DELIVERY', 'DELIVERY'), require('./routes/delivery'));
app.use('/api/complaints', auth, logAudit('RESPOND_COMPLAINT', 'COMPLAINTS'), require('./routes/complaints'));
app.use('/api/fraud', auth, logAudit('PROCESS_FRAUD', 'FRAUD'), require('./routes/fraud'));
app.use('/api/predictions', auth, require('./routes/predictions'));
app.use('/api/donations', auth, require('./routes/donations'));
app.use('/api/notifications', auth, logAudit('SEND_NOTIFICATION', 'NOTIFICATIONS'), require('./routes/notifications'));
app.use('/api/reports', auth, require('./routes/reports'));
app.use('/api/ml', require('./routes/ml'));
app.use('/api/audit', auth, superAdminOnly, require('./routes/audit'));
app.use('/api/eligibility', auth, require('./routes/eligibility'));
app.use('/api/ration-records', auth, require('./routes/ration-records'));
app.use('/api/hospital', require('./routes/hospital'));

app.use('/api/shop', auth, require('./routes/shop-portal'));
app.use('/api/admin/analytics', auth, require('./routes/analytics'));
app.use('/api/admin/ai-stock-prediction', auth, require('./routes/ai-prediction-admin'));
app.use('/api/admin/run-stock-prediction', auth, require('./routes/run-stock-prediction'));
app.use('/api/admin', auth, require('./routes/donations-admin'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/orphanage', require('./routes/orphanage'));

const connectDB = require('./config/db.js');

// Serve static documents uploaded by citizens
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    const fs = require('fs');
    const logMessage = `${new Date().toISOString()} - GLOBAL ERROR: ${err.stack}\n`;
    fs.appendFileSync('debug.log', logMessage);
    console.error(logMessage);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        
        // Create default admin if none exists
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const hashedPw = await bcrypt.hash('admin123', 10);
            await Admin.create({
                name: 'Super Administrator',
                email: 'admin@srms.gov.in',
                password: hashedPw,
                role: 'shop_owner'
            });
            console.log('✅ Default Super Admin created: admin@srms.gov.in | admin123');
        }

        // Create default hospital if none exists
        const hospitalCount = await Hospital.countDocuments();
        if (hospitalCount === 0) {
            const hashedPw = await bcrypt.hash('hospital123', 10);
            await Hospital.create({
                hospitalName: 'City Medical College & Hospital',
                hospitalId: 'HOSP001',
                email: 'verify@cityhospital.gov.in',
                password: hashedPw
            });
            console.log('✅ Default Hospital Verifier created: verify@cityhospital.gov.in | hospital123');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Server startup error:', err);
        process.exit(1);
    }
};

startServer();
