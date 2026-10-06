const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const migrateUsers = async () => {
    if (!process.env.MONGO_URI) {
        console.error('Error: MONGO_URI is not defined in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for user migration.');

        const result = await User.updateMany(
            {
                $or: [
                    { role: { $exists: false } },
                    { role: null },
                    { role: '' }
                ]
            },
            { $set: { role: 'user' } }
        );

        console.log(`[OK] Migration completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount} user documents.`);
    } catch (err) {
        console.error('Error migrating users:', err.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

migrateUsers();
