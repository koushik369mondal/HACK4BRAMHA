const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const { UserProfile, Complaint, Department } = require('./models');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🧹 Clearing existing data...');
    await UserProfile.deleteMany({});
    await Complaint.deleteMany({});
    await Department.deleteMany({});

    // Create departments
    console.log('\n🏢 Creating departments...');
    const departments = [
      {
        name: 'Water Supply',
        description: 'Water supply and sanitation issues',
        email: 'water@naiyaksetu.gov.in',
        contact_person: 'Water Department Officer',
        phone: '+91-9876543210'
      },
      {
        name: 'Electricity',
        description: 'Power supply and electrical issues',
        email: 'electricity@naiyaksetu.gov.in',
        contact_person: 'Electricity Department Officer',
        phone: '+91-9876543211'
      },
      {
        name: 'Roads & Transport',
        description: 'Road maintenance and transportation issues',
        email: 'roads@naiyaksetu.gov.in',
        contact_person: 'Roads Department Officer',
        phone: '+91-9876543212'
      },
      {
        name: 'Health Services',
        description: 'Public health and medical services',
        email: 'health@naiyaksetu.gov.in',
        contact_person: 'Health Department Officer',
        phone: '+91-9876543213'
      }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log(`✅ Created ${createdDepartments.length} departments`);

    // Create test users
    console.log('\n👥 Creating test users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91-9876543220',
        password: hashedPassword,
        role: 'customer',
        is_verified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+91-9876543221',
        password: hashedPassword,
        role: 'customer',
        is_verified: true
      },
      {
        name: 'Admin User',
        email: 'admin@naiyaksetu.gov.in',
        phone: '+91-9876543222',
        password: hashedPassword,
        role: 'admin',
        is_verified: true
      }
    ];

    const createdUsers = await UserProfile.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create test complaints
    console.log('\n📝 Creating test complaints...');
    const complaints = [
      {
        complaint_id: 'CMP-2025-001',
        user_id: createdUsers[0]._id.toString(),
        title: 'Water supply issue in Sector 15',
        category: 'Water Supply',
        description: 'No water supply for the past 3 days in Sector 15. Residents are facing severe water shortage.',
        priority: 'high',
        status: 'submitted',
        location: {
          address: 'Sector 15, Block A, New Delhi',
          coordinates: {
            lat: 28.6139,
            lng: 77.2090
          }
        },
        contact_info: {
          name: 'John Doe',
          phone: '+91-9876543220',
          email: 'john@example.com'
        }
      },
      {
        complaint_id: 'CMP-2025-002',
        user_id: createdUsers[0]._id.toString(),
        title: 'Street light not working',
        category: 'Electricity',
        description: 'Street light on Main Road has been non-functional for 2 weeks causing safety issues.',
        priority: 'medium',
        status: 'in_progress',
        location: {
          address: 'Main Road, Sector 12, New Delhi',
          coordinates: {
            lat: 28.6129,
            lng: 77.2080
          }
        },
        contact_info: {
          name: 'John Doe',
          phone: '+91-9876543220',
          email: 'john@example.com'
        }
      },
      {
        complaint_id: 'CMP-2025-003',
        user_id: createdUsers[1]._id.toString(),
        title: 'Pothole on highway',
        category: 'Roads & Infrastructure',
        description: 'Large pothole causing traffic issues and vehicle damage on NH-44.',
        priority: 'urgent',
        status: 'resolved',
        location: {
          address: 'NH-44, Kilometer 15, New Delhi',
          coordinates: {
            lat: 28.6149,
            lng: 77.2100
          }
        },
        contact_info: {
          name: 'Jane Smith',
          phone: '+91-9876543221',
          email: 'jane@example.com'
        },
        resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        complaint_id: 'CMP-2025-004',
        user_id: createdUsers[1]._id.toString(),
        title: 'Garbage collection delay',
        category: 'Sanitation & Waste',
        description: 'Garbage has not been collected for over a week in our area.',
        priority: 'medium',
        status: 'closed',
        location: {
          address: 'Green Park Extension, New Delhi',
          coordinates: {
            lat: 28.6159,
            lng: 77.2110
          }
        },
        contact_info: {
          name: 'Jane Smith',
          phone: '+91-9876543221',
          email: 'jane@example.com'
        },
        resolved_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        complaint_id: 'CMP-2025-005',
        user_id: createdUsers[0]._id.toString(),
        title: 'Hospital equipment shortage',
        category: 'Health Services',
        description: 'Government hospital lacks basic medical equipment and medicines.',
        priority: 'urgent',
        status: 'submitted',
        location: {
          address: 'Government Hospital, Sector 8, New Delhi',
          coordinates: {
            lat: 28.6169,
            lng: 77.2120
          }
        },
        contact_info: {
          name: 'John Doe',
          phone: '+91-9876543220',
          email: 'john@example.com'
        }
      }
    ];

    const createdComplaints = await Complaint.insertMany(complaints);
    console.log(`✅ Created ${createdComplaints.length} complaints`);

    // Display summary
    console.log('\n📊 Database seeded successfully!');
    console.log('Summary:');
    console.log(`  - Departments: ${createdDepartments.length}`);
    console.log(`  - Users: ${createdUsers.length}`);
    console.log(`  - Complaints: ${createdComplaints.length}`);
    
    console.log('\n👤 Test user credentials:');
    console.log('  - Email: john@example.com');
    console.log('  - Email: jane@example.com'); 
    console.log('  - Email: admin@naiyaksetu.gov.in');
    console.log('  - Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

seedDatabase();