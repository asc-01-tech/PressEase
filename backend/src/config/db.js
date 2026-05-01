const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected (Memory Server): ${conn.connection.host}`);
    
    // Seed default admin user
    const existing = await User.findOne({ username: 'admin' });
    if (!existing) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        shopName: process.env.SHOP_NAME || 'My Press Shop',
      });
      console.log('✅ Admin user created: username=admin, password=admin123');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
