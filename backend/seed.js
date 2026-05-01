require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('Admin user already exists. Skipping seed.');
    } else {
      await User.create({
        username: 'admin',
        password: 'admin123',
        shopName: process.env.SHOP_NAME || 'My Press Shop',
      });
      console.log('✅ Admin user created: username=admin, password=admin123');
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
