const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const colors = require("colors");

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Exit application on error
mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
});

// Log MongoDB queries in development
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
}

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('❌ MONGO_URI is not defined in environment variables');
        }
        
        const conn = await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: process.env.MONGO_DB_NAME || "ministry_youth_sports",
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            family: 4, // Use IPv4, skip trying IPv6
            maxPoolSize: 10, // Maintain up to 10 socket connections
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline);
        return conn;
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`.red.underline.bold);
        process.exit(1);
    }
};

// Handle Node process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

module.exports = connectDB;
