const mongoose = require('mongoose');
const { Complaint, UserProfile, Department, OtpCode } = require('./models');
require('dotenv').config();

const cleanupAndSetup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'naiyaksetu'
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.name);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Current collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Remove test collections (collections that might have test data)
    const testCollections = ['test', 'tests', 'temp', 'demo'];
    for (const testCol of testCollections) {
      const exists = collections.find(col => col.name === testCol);
      if (exists) {
        await mongoose.connection.db.dropCollection(testCol);
        console.log(`🗑️  Dropped test collection: ${testCol}`);
      }
    }
    
    // Ensure indexes are created for all models
    console.log('\n🔧 Setting up indexes...');
    await Complaint.createIndexes();
    console.log('✅ Complaint indexes created');
    
    await UserProfile.createIndexes();
    console.log('✅ UserProfile indexes created');
    
    await Department.createIndexes();
    console.log('✅ Department indexes created');
    
    await OtpCode.createIndexes();
    console.log('✅ OtpCode indexes created');
    
    // Seed departments if they don't exist
    const departmentCount = await Department.countDocuments();
    if (departmentCount === 0) {
      console.log('\n🌱 Seeding departments...');
      const departments = [
        { name: 'Roads & Infrastructure', description: 'Road maintenance, construction, and infrastructure issues' },
        { name: 'Water Supply', description: 'Water supply, quality, and distribution issues' },
        { name: 'Electricity', description: 'Power supply, outages, and electrical infrastructure' },
        { name: 'Sanitation & Waste', description: 'Waste management, cleaning, and sanitation services' },
        { name: 'Public Safety', description: 'Law enforcement, emergency services, and public safety' },
        { name: 'Traffic & Transportation', description: 'Traffic management, public transport, and transportation issues' },
        { name: 'Environment', description: 'Environmental protection, pollution, and conservation' },
        { name: 'Health Services', description: 'Public health services, hospitals, and medical facilities' },
        { name: 'General', description: 'General complaints and other miscellaneous issues' }
      ];
      
      await Department.insertMany(departments);
      console.log(`✅ Seeded ${departments.length} departments`);
    } else {
      console.log(`✅ Departments already exist (${departmentCount} found)`);
    }
    
    // Verify collections and counts
    console.log('\n📊 Collection status:');
    const stats = {
      complaints: await Complaint.countDocuments(),
      userProfiles: await UserProfile.countDocuments(),
      departments: await Department.countDocuments(),
      otpCodes: await OtpCode.countDocuments()
    };
    
    Object.entries(stats).forEach(([collection, count]) => {
      console.log(`  - ${collection}: ${count} documents`);
    });
    
    console.log('\n✅ Database cleanup and setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup and setup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the cleanup and setup
cleanupAndSetup();