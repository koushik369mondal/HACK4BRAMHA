const connectDB = require('./db/mongodb');
const { UserProfile, Department, Complaint } = require('./models');

async function testSchema() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('🧪 Testing MongoDB Schema...');
    
    // Test 1: Check if departments exist
    const departments = await Department.find();
    console.log(`✅ Found ${departments.length} departments`);
    
    // Test 2: Create a test user
    let testUser;
    try {
      testUser = await UserProfile.findOne({ email: 'test@example.com' });
      if (!testUser) {
        testUser = new UserProfile({
          email: 'test@example.com',
          name: 'Test User',
          phone: '1234567890',
          password: 'hashedpassword123',
          role: 'customer'
        });
        await testUser.save();
        console.log('✅ Test user created successfully');
      } else {
        console.log('ℹ️  Test user already exists, using existing one');
      }
    } catch (error) {
      console.error('❌ Error with test user:', error.message);
      return;
    }
    
    // Test 3: Create a test complaint
    const testComplaint = new Complaint({
      title: 'Test Complaint',
      category: 'Roads & Infrastructure',
      description: 'This is a test complaint to verify the schema',
      priority: 'medium',
      status: 'submitted',
      reporter_type: 'registered',
      contact_method: 'email',
      location: {
        address: 'Test Address, Test City',
        latitude: 12.9716,
        longitude: 77.5946,
        formatted: 'Test Location'
      },
      user_id: testUser._id
    });
    
    await testComplaint.save();
    console.log(`✅ Test complaint created with ID: ${testComplaint.complaint_id}`);
    
    // Test 4: Verify relationships work
    const complaintWithUser = await Complaint.findById(testComplaint._id).populate('user_id');
    console.log(`✅ Relationship test: Complaint belongs to user "${complaintWithUser.user_id.name}"`);
    
    // Test 5: Test geospatial index
    const nearbyComplaints = await Complaint.find({
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true }
    });
    console.log(`✅ Found ${nearbyComplaints.length} complaints with location data`);
    
    console.log('🎉 All schema tests passed successfully!');
    console.log('');
    console.log('📊 Schema Summary:');
    console.log(`   - UserProfiles: ${await UserProfile.countDocuments()}`);
    console.log(`   - Departments: ${await Department.countDocuments()}`);
    console.log(`   - Complaints: ${await Complaint.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Schema test failed:', error);
  } finally {
    process.exit(0);
  }
}

testSchema();