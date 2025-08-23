const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Configure dotenv to look for .env file in parent directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: "ministry_youth_sports"
        });
        console.log("✅ MongoDB Connected...");
    } catch (err) {
        console.error("❌ Error connecting MongoDB:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
