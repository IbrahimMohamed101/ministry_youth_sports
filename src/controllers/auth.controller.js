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

/**
 * Verify token and return user role
 * @route GET /api/auth/verify-token
 * @access Public
 */
exports.verifyToken = (req, res) => {
    const authHeader = req.headers.authorization;
    
    // Check if no token
    if (!authHeader) {
        return res.status(401).json({ 
            success: false,
            message: 'No token provided' 
        });
    }

    // Extract token from Bearer
    const token = authHeader.split(' ')[1];
    
    // Check if token exists
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Invalid token format' 
        });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ 
            success: false,
            message: 'Token has been invalidated (logged out)' 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Return success with user role
        return res.status(200).json({
            success: true,
            message: 'Token is valid',
            role: decoded.role,
            email: decoded.email
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token has expired' 
            });
        }
        
        return res.status(403).json({ 
            success: false,
            message: 'Invalid token' 
        });
    }
};

module.exports = {
    login: exports.login,
    logout: exports.logout,
    getProfile: exports.getProfile,
    verifyToken: exports.verifyToken,
    tokenBlacklist: exports.tokenBlacklist
};
