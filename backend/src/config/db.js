const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    
    if (!uri || uri.includes('memory')) {
      console.log('⚠️ No MONGO_URI found, using MongoMemoryServer...');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
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
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
