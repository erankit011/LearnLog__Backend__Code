const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const mongoURI = env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    };

    await mongoose.connect(mongoURI, options);

    console.log('[OK] MongoDB connected successfully');
    console.log(`[DB] Database: ${mongoURI.split('/').pop().split('?')[0]}`);

    mongoose.connection.on('error', (err) => {
      console.error('[ERROR] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[WARNING] MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[OK] MongoDB reconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[OK] MongoDB connection closed');
      process.exit(0);
    });

  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
