const authMiddleware = require("../middleware/auth");
const { isCentersUser } = require("../middleware/roles");

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

    router.post("/", authMiddleware , isCentersUser, createCenter);
    router.put("/:id",authMiddleware , isCentersUser, updateCenter);
    router.patch("/:id/activities", authMiddleware , isCentersUser, updateCenterActivities);
    router.patch("/:id/membership", authMiddleware , isCentersUser, updateCenterMembership);
    router.post("/:id/activities/:type",authMiddleware , isCentersUser, addActivityToCenter);
    router.delete("/:id/activities/:type/:activityId",authMiddleware , isCentersUser, removeActivityFromCenter);
    router.delete("/:id", authMiddleware , isCentersUser, deleteCenter);

    module.exports = router;