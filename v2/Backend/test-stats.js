const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Complaint } = require('./models');

async function testStats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test aggregation pipeline
    const pipeline = [
      {
        $group: {
          _id: null,
          total_complaints: { $sum: 1 },
          submitted_count: {
            $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] }
          },
          in_progress_count: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
          },
          resolved_count: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          closed_count: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
          }
        }
      }
    ];

    console.log('\n📊 Testing complaint stats aggregation...');
    const result = await Complaint.aggregate(pipeline);
    console.log('Stats result:', result);

    // Also check total count
    const totalCount = await Complaint.countDocuments();
    console.log('Total complaints count:', totalCount);

    // Check sample data
    const samples = await Complaint.find().limit(2);
    console.log('Sample complaints:', samples);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testStats();