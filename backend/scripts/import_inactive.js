const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Shop = require('../models/Shop');
const RationCardRecord = require('../models/RationCardRecord');

const importInactive = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for Import');

        const filePath = path.join(__dirname, '../inactive_users.txt');
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            process.exit(1);
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Find a default shop to link new users to
        const defaultShop = await Shop.findOne() || { _id: null, district: 'Chennai' };

        let importedCount = 0;

        for (const line of lines) {
            // Regex to match: User: [Name] | Ration: [RC] | Aadhaar: [Aadhaar]
            const match = line.match(/User:\s*(.*?)\s*\|\s*Ration:\s*(.*?)\s*\|\s*Aadhaar:\s*(\d+)/i);
            
            if (match) {
                const [_, name, rationCard, aadhaar] = match;

                // 1. Create/Update User Record (Inactive)
                await User.updateOne(
                    { aadhaar: aadhaar },
                    { 
                        $set: {
                            name: name.trim(),
                            rationCard: rationCard.trim(),
                            aadhaar: aadhaar.trim(),
                            status: 'inactive',
                            isRegistered: false,
                            shopId: defaultShop._id,
                            district: defaultShop.district,
                            address: `Sample Address, ${defaultShop.district}`,
                            category: 'PHH',
                            familyMembers: 1
                        }
                    },
                    { upsert: true }
                );

                // 2. Create/Update Government Ration Record
                await RationCardRecord.updateOne(
                    { rationCardNumber: rationCard.trim() },
                    {
                        $set: {
                            rationCardNumber: rationCard.trim(),
                            category: 'PHH',
                            district: defaultShop.district,
                            address: `Sample Address, ${defaultShop.district}`,
                            assignedShop: defaultShop._id,
                            members: [{
                                name: name.trim(),
                                aadhaar: aadhaar.trim(),
                                relation: 'Head',
                                gender: 'Male',
                                dob: '01/01/1980'
                            }],
                            registered: false
                        }
                    },
                    { upsert: true }
                );

                console.log(`➕ Processed: ${name.trim()} (${rationCard.trim()})`);
                importedCount++;
            }
        }

        console.log(`\n✨ Successfully processed ${importedCount} users from ${path.basename(filePath)}`);
        console.log('🚀 These users can now register on the Citizen Portal!\n');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Import error:', err);
        process.exit(1);
    }
};

importInactive();
