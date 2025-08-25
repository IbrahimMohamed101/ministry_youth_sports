    const express = require("express");
    const router = express.Router();
    const {
    getCenters,
    getCenter,
    createCenter,
    updateCenter,
    deleteCenter,
    getCentersByActivity,
    getAllActivities,
    getCentersStats,
    updateCenterActivities,
    updateCenterMembership,
    addActivityToCenter,
    removeActivityFromCenter
    } = require("../controllers/center.controller");

    // Public routes
    router.get("/", getCenters);
    router.get("/stats", getCentersStats);
    router.get("/activities", getAllActivities);
    router.get("/activity/:type/:activityId", getCentersByActivity);
    router.get("/:id", getCenter);

    // Protected routes (uncomment and adjust middleware as needed)
    // router.use(protect); // Apply authentication to all routes below

    router.post("/", createCenter);
    router.put("/:id", updateCenter);
    router.patch("/:id/activities", updateCenterActivities);
    router.patch("/:id/membership", updateCenterMembership);
    router.post("/:id/activities/:type", addActivityToCenter);
    router.delete("/:id/activities/:type/:activityId", removeActivityFromCenter);
    router.delete("/:id", deleteCenter);

    module.exports = router;