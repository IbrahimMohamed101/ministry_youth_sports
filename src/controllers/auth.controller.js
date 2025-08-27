const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.mode");

// In-memory token blacklist (for demonstration purposes)
// In production, consider using Redis or database for token blacklisting
const tokenBlacklist = new Set();

// Export tokenBlacklist for use in middleware
exports.tokenBlacklist = tokenBlacklist;

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
        );

        res.json({ 
        token,
        user: {
            email: user.email,
            role: user.role
        }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    exports.getProfile = async (req, res) => {
    res.json({
        email: req.user.email,
        role: req.user.role,
        id: req.user._id
    });
    };

    exports.logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(400).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(400).json({ message: "Invalid token format" });
        }

        // Add token to blacklist
        tokenBlacklist.add(token);

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };
