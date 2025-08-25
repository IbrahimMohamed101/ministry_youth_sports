const jwt = require("jsonwebtoken");
const User = require("../models/user.mode");

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
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
