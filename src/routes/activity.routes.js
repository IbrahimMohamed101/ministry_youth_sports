const express = require("express");

const authMiddleware = require("../middleware/auth");
const { isActivitiesUser } = require("../middleware/roles");
const router = express.Router();
const {
    getActivities,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivitiesByStatus,
    getUpcomingActivities,
    updateActivityStatus,
    getActivitiesStats
} = require("../controllers/activity.controller");

// Import middleware (you'll need to create these or adjust based on your auth system)
// const { protect, authorize } = require("../middleware/auth");
// const { validateActivity } = require("../middleware/validation");

// Public routes
router.get("/", getActivities);
router.get("/stats", getActivitiesStats);
router.get("/upcoming", getUpcomingActivities);
router.get("/status/:status", getActivitiesByStatus);
router.get("/:id", getActivity);

// Protected routes (uncomment and adjust middleware as needed)
// router.use(protect); // Apply authentication to all routes below

router.post("/", authMiddleware, isActivitiesUser, createActivity);
router.put("/:id", authMiddleware, isActivitiesUser, updateActivity);
router.patch("/:id/status", authMiddleware, isActivitiesUser, updateActivityStatus);
router.delete("/:id", authMiddleware, isActivitiesUser, deleteActivity);

// Admin only routes (uncomment if you have role-based access)
// router.use(authorize("admin"));
// router.delete("/:id", deleteActivity);

module.exports = router;