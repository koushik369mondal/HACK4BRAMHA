// MongoDB connection - use the centralized connection
const connectDB = require('./mongodb');

// Export the connection function for backward compatibility
module.exports = connectDB;
