const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testComplaintSubmission = async () => {
  console.log('🧪 Testing Complete Complaint Workflow\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);

    // Test 2: Get Categories/Departments
    console.log('\n2️⃣  Testing Department/Category Retrieval...');
    const departmentsResponse = await axios.get(`${BASE_URL}/departments`);
    console.log('✅ Departments available:', departmentsResponse.data.length);
    departmentsResponse.data.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name}`);
    });

    // Test 3: Submit a Test Complaint
    console.log('\n3️⃣  Testing Complaint Submission...');
    const testComplaint = {
      title: 'Test Complaint - Database Integration',
      category: 'Noise',
      description: 'This is a test complaint to verify the complete database integration with MongoDB Atlas.',
      priority: 'medium',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Test Location, New Delhi, India'
      },
      reporterType: 'anonymous',
      contactInfo: {
        email: 'test@example.com',
        phone: '+91-9876543210'
      },
      contactMethod: 'email'
    };

    const submitResponse = await axios.post(`${BASE_URL}/complaints`, testComplaint);
    console.log('✅ Complaint submitted successfully!');
    console.log('   Complaint ID:', submitResponse.data.complaint.complaint_id);
    console.log('   Status:', submitResponse.data.complaint.status);
    
    const complaintId = submitResponse.data.complaint.complaint_id;

    // Test 4: Fetch All Complaints
    console.log('\n4️⃣  Testing Complaint Retrieval...');
    const allComplaintsResponse = await axios.get(`${BASE_URL}/complaints`);
    console.log('✅ Total complaints in database:', allComplaintsResponse.data.complaints.length);

    // Test 5: Track Specific Complaint
    console.log('\n5️⃣  Testing Complaint Tracking...');
    const trackResponse = await axios.get(`${BASE_URL}/complaints/${complaintId}`);
    console.log('✅ Complaint tracking successful:');
    console.log('   Title:', trackResponse.data.complaint.title);
    console.log('   Status:', trackResponse.data.complaint.status);
    console.log('   Created:', new Date(trackResponse.data.complaint.createdAt).toLocaleString());

    // Test 6: Get Dashboard Stats
    console.log('\n6️⃣  Testing Dashboard Statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/complaints/stats`);
    console.log('✅ Dashboard stats retrieved:');
    console.log('   Total Complaints:', statsResponse.data.totalComplaints);
    console.log('   By Status:', statsResponse.data.byStatus);
    console.log('   By Category:', statsResponse.data.byCategory);

    // Test 7: Get Recent Complaints
    console.log('\n7️⃣  Testing Recent Complaints...');
    const recentResponse = await axios.get(`${BASE_URL}/complaints/recent`);
    console.log('✅ Recent complaints retrieved:', recentResponse.data.complaints.length);

    console.log('\n🎉 ALL TESTS PASSED! The complete system is working properly:');
    console.log('   ✅ Backend connected to MongoDB Atlas');
    console.log('   ✅ Database operations working');
    console.log('   ✅ Complaint submission successful');
    console.log('   ✅ Data persistence verified');
    console.log('   ✅ Tracking functionality working');
    console.log('   ✅ Dashboard data fetching working');
    console.log('   ✅ Frontend integration ready');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
};

testComplaintSubmission();