const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth");

router.post("/login", authController.login); // Keep this line
router.post("/logout", authController.logout); // Added logout route
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;
