const mongoose = require('mongoose');
require('dotenv').config();

const verifyDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'naiyaksetu' });
    console.log('✅ Connected to MongoDB Atlas - naiyaksetu database');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Current collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check for test collections and remove them
    const testCollections = ['test', 'tests', 'temp', 'demo'];
    let removedAny = false;
    
    for (const testCol of testCollections) {
      const exists = collections.find(col => col.name === testCol);
      if (exists) {
        await mongoose.connection.db.dropCollection(testCol);
        console.log(`🗑️  Dropped test collection: ${testCol}`);
        removedAny = true;
      }
    }
    
    if (!removedAny) {
      console.log('✅ No test collections found to remove');
    }
    
    // Get updated collections list
    const updatedCollections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Collection status after cleanup:');
    
    for (const col of updatedCollections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
    }
    
    console.log('\n✅ Database verification and cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

verifyDatabase();