const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const { UserProfile } = require('./models');

async function debugLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'john@example.com';
    const password = 'password123';

    console.log(`\n🔍 Debugging login for: ${email}`);

    // Step 1: Find user
    console.log('\n1️⃣ Finding user...');
    const user = await UserProfile.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Verified: ${user.is_verified}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);

    // Step 2: Check verification
    console.log('\n2️⃣ Checking verification...');
    if (!user.is_verified) {
      console.log('❌ User not verified');
      return;
    }
    console.log('✅ User is verified');

    // Step 3: Verify password
    console.log('\n3️⃣ Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`Password valid: ${isValidPassword}`);

    if (isValidPassword) {
      console.log('\n✅ All checks passed - login should succeed');
    } else {
      console.log('\n❌ Password verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugLogin();