const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
    const email = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || process.argv[3] || 'Admin@123';

    if (!process.env.MONGO_URI) {
        console.error('Error: MONGO_URI is not defined in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for admin seeding.');

        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            user.role = 'admin';
            // Optionally update password if provided
            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }
            await user.save();
            console.log(`[OK] Existing user promoted to admin: ${user.email} (Role: ${user.role})`);
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await User.create({
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'admin'
            });
            console.log(`[OK] New admin user created successfully: ${user.email} (Role: ${user.role})`);
        }
    } catch (err) {
        console.error('Error seeding admin user:', err.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

seedAdmin();
