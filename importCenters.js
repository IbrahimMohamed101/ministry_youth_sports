const mongoose = require('mongoose');
const Center = require('./src/models/Center');
require('dotenv').config();

// Sample center data - replace this with your actual data
const centers = [
  {
    name: "مركز شباب مدينة نصر",
    phone: "0223456789",
    address: "مدينة نصر، القاهرة",
    facebookLink: "https://facebook.com/example",
    location: "30.0444,31.2357",
    LocationArea: "مدينة نصر",
    image: "center1.jpg"
  },
  // Add more centers as needed
];

async function importCenters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hemaatar:011461519790aA%23@cluster0.sj6apui.mongodb.net/ministry_youth_sports?retryWrites=true&w=majority&appName=ministry_youth_sports', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing centers
    await Center.deleteMany({});
    console.log('Cleared existing centers');

    // Insert new centers
    const createdCenters = await Center.insertMany(centers);
    console.log(`Successfully imported ${createdCenters.length} centers`);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error importing centers:', error);
    process.exit(1);
  }
}

importCenters();
