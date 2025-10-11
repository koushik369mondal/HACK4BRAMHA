const connectDB = require('./mongodb');
const { Department } = require('../models');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('🔄 Initializing MongoDB database...');

    // Create default departments
    const defaultDepartments = [
      {
        name: 'Roads & Infrastructure',
        description: 'Handles road maintenance, potholes, and infrastructure issues',
        contact_email: 'roads@naiyaksetu.gov',
        contact_phone: '+91-1234567801'
      },
      {
        name: 'Water Supply',
        description: 'Manages water supply, quality, and distribution issues',
        contact_email: 'water@naiyaksetu.gov',
        contact_phone: '+91-1234567802'
      },
      {
        name: 'Electricity',
        description: 'Handles power outages, electrical faults, and billing issues',
        contact_email: 'electricity@naiyaksetu.gov',
        contact_phone: '+91-1234567803'
      },
      {
        name: 'Sanitation & Waste',
        description: 'Manages garbage collection, waste disposal, and cleanliness',
        contact_email: 'sanitation@naiyaksetu.gov',
        contact_phone: '+91-1234567804'
      },
      {
        name: 'Public Safety',
        description: 'Handles safety concerns, security, and emergency services',
        contact_email: 'safety@naiyaksetu.gov',
        contact_phone: '+91-1234567805'
      },
      {
        name: 'Traffic & Transportation',
        description: 'Manages traffic issues, public transport, and parking',
        contact_email: 'traffic@naiyaksetu.gov',
        contact_phone: '+91-1234567806'
      },
      {
        name: 'Environment',
        description: 'Handles pollution, environmental concerns, and green initiatives',
        contact_email: 'environment@naiyaksetu.gov',
        contact_phone: '+91-1234567807'
      },
      {
        name: 'Health Services',
        description: 'Manages public health facilities and medical services',
        contact_email: 'health@naiyaksetu.gov',
        contact_phone: '+91-1234567808'
      }
    ];

    // Insert departments if they don't exist
    for (const deptData of defaultDepartments) {
      try {
        const existingDept = await Department.findOne({ name: deptData.name });
        if (!existingDept) {
          await Department.create(deptData);
          console.log(`✅ Created department: ${deptData.name}`);
        } else {
          console.log(`ℹ️  Department already exists: ${deptData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error creating department ${deptData.name}:`, error.message);
      }
    }

    console.log('✅ MongoDB database initialization complete!');
    console.log('📊 Created departments and indexes');
    console.log('🚀 Ready for user registration, complaint submission, and admin management');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('� Initialization complete, exiting...');
    process.exit(0);
  });
}

module.exports = { initializeDatabase };