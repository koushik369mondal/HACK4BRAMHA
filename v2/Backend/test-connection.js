const connectDB = require('./db/mongodb');

// Test MongoDB connection
async function testConnection() {
  try {
    await connectDB();
    console.log('🎉 MongoDB connection test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    process.exit(1);
  }
}

testConnection();