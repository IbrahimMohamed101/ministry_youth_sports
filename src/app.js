    const express = require("express");
    const dotenv = require("dotenv");
    const path = require("path");
    const cors = require("cors");
    const helmet = require("helmet");
    const morgan = require("morgan");
    const connectDB = require("./config/db");
    const { errorHandler } = require("./middleware/validation");

    // Configure dotenv
    dotenv.config({ path: path.join(__dirname, '..', '.env') });

    // Connect to database
    connectDB();

    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
    }));

    // Logging middleware
    app.use(morgan('combined'));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // Health check endpoint
    app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
    });

    // API routes
    const newsRoutes = require("./routes/news.routes");
    app.use("/api/news", newsRoutes);

    // Handle 404
    app.use(/.*/, (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
    });

    // Error handling middleware
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`📰 News API: http://localhost:${PORT}/api/news`);
    });