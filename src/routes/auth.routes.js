const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth");

// Public routes
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/verify-token", authController.verifyToken);

// Protected routes (require valid token)
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;
