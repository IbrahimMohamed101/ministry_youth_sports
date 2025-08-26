const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { isCentersUser } = require("../middleware/roles");

const {
    getCenters,
    getCentersByLocationArea,
    getCentersByRegion,
    getCentersGroupedByLocationArea,
    searchCenters,
    getCenter,
    createCenter,
    updateCenter,
    deleteCenter,
    getCentersByActivity,
    getAllActivities,
    getCentersStats,
    getAvailableLocationAreas,
    getAvailableRegions,
    updateCenterActivities,
    updateCenterMembership
} = require('../controllers/center.controller');

// Public routes - order matters! More specific routes should come before less specific ones

// Stats and activities routes
router.get('/stats', getCentersStats);
router.get('/activities', getAllActivities);

// LocationArea routes (your main search functionality)
router.get('/location-areas', getAvailableLocationAreas);
router.get('/by-location-area/:locationArea', getCentersByLocationArea);
router.get('/grouped-by-location-area', getCentersGroupedByLocationArea);

// Region routes
router.get('/regions', getAvailableRegions);
router.get('/by-region/:region', getCentersByRegion);

// Activity search routes
router.get('/activity/:type/:activityId', getCentersByActivity);

// Search route
router.get('/search', searchCenters);

// Single center route (must come after all other /something routes)
router.get('/:id', getCenter);

// Main centers route (must be last among GET routes)
router.get('/', getCenters);

// Protected routes (require authentication and center user role)
router.use(authMiddleware);
router.use(isCentersUser);

// CRUD operations for authenticated users
router.post('/', createCenter);
router.put('/:id', updateCenter);
router.delete('/:id', deleteCenter);

// Activity management for authenticated users
router.patch('/:id/activities', updateCenterActivities);

// Membership management for authenticated users
router.patch('/:id/membership', updateCenterMembership);

module.exports = router;