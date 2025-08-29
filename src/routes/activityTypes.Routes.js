    const express = require("express");
    const router = express.Router();
    const {
    getActivitiesByType,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    getAllActivities,
    bulkCreateActivities,
    searchAllActivities,
    getActivityStats
    } = require("../controllers/activityTypes.Controller");
    const authMiddleware = require("../middleware/auth");
    const { isCentersUser } = require("../middleware/roles");

    // Public routes
    router.get("/", getAllActivities);
    router.get("/stats", getActivityStats);
    router.get("/search", searchAllActivities);
    router.get("/:type", getActivitiesByType);
    router.get("/:type/:id", getActivity);

    // Protected routes (Admin only - uncomment and adjust middleware as needed)
router.use(authMiddleware);
router.use(isCentersUser);

    router.post("/:type", createActivity);
    router.post("/:type/bulk", bulkCreateActivities);
    router.put("/:type/:id", updateActivity);
    router.delete("/:type/:id", deleteActivity);

    module.exports = router;