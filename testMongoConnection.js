const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hemaatar:011461519790aA%23@cluster0.sj6apui.mongodb.net/ministry_youth_sports?retryWrites=true&w=majority&appName=ministry_youth_sports');
    console.log('✅ Successfully connected to MongoDB');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. Check if the MongoDB service is running (on Windows: services.msc)');
    console.log('3. Verify your MONGODB_URI in .env file');
    console.log('4. If using a cloud database, ensure your IP is whitelisted');
  }
}

testConnection();
