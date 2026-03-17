const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const listInactive = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('\n--- 📋 Inactive Users for Registration Testing ---\n');
        
        const inactiveUsers = await User.find({ status: 'inactive', isRegistered: false })
            .limit(10)
            .select('name aadhaar rationCard district');

        if (inactiveUsers.length === 0) {
            console.log('No inactive users found. Please run the seed script first.');
        } else {
            let fileContent = '--- 📋 Inactive Users for Registration Testing ---\n\n';
            inactiveUsers.forEach(u => {
                const line = `User: ${u.name} | Ration: ${u.rationCard} | Aadhaar: ${u.aadhaar}`;
                console.log(line);
                fileContent += line + '\n';
            });
            
            const filePath = path.join(__dirname, '../inactive_users.txt');
            fs.writeFileSync(filePath, fileContent);
            console.log(`\n✅ Data saved to: ${filePath}`);
            console.log('\nYou can use these in the Citizen Registration page.\n');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

listInactive();
