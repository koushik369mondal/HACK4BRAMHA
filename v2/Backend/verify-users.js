const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const { UserProfile } = require('./models');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await UserProfile.find({}, 'email name password is_verified').limit(5);
    console.log(`\n📊 Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Verified: ${user.is_verified}`);
      console.log(`   Password hash exists: ${!!user.password}`);
      
      // Test password
      if (user.password) {
        const isValid = await bcrypt.compare('password123', user.password);
        console.log(`   Password 'password123' valid: ${isValid}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkUsers();