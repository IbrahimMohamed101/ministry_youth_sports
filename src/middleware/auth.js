const jwt = require("jsonwebtoken");
const User = require("../models/user.mode");

// Import the token blacklist from auth controller
const { tokenBlacklist } = require("../controllers/auth.controller");

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: "Token has been invalidated (logged out)" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });
        if (!user) return res.status(401).json({ message: "User not found" });

        req.user = user; // خزنا بيانات اليوزر
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

module.exports = authMiddleware;
