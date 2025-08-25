    const jwt = require("jsonwebtoken");
    const bcrypt = require("bcryptjs");
    const User = require("../models/user.mode");

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
