const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { isCentersUser } = require("../middleware/roles");
const { uploadSingleImage, cleanupUploads } = require('../middleware/upload');

const {
    getCenters,
    getCentersByLocationArea,
    getCenter,
    createCenter,
    updateCenter,
    deleteCenter,
    getAllActivities,
    addActivitiesToCenter,
    removeActivityFromCenter
} = require('../controllers/center.controller');

// Public routes - order matters! More specific routes should come before less specific ones

// Activities route
router.get('/activities', getAllActivities);

// LocationArea routes (your main search functionality)
// Usage: GET /api/centers/by-location-area/eastern (for الشرقية)
// Usage: GET /api/centers/by-location-area/western (for الغربية)
// Usage: GET /api/centers/by-location-area/northern (for الشمالية)  
// Usage: GET /api/centers/by-location-area/southern (for الجنوبية)
router.get('/by-location-area/:locationArea', getCentersByLocationArea);

// Single center route (must come after all other /something routes)
router.get('/:id', getCenter);

// Main centers route (must be last among GET routes)
router.get('/', getCenters);

// Protected routes (require authentication and center user role)
router.use(authMiddleware);
router.use(isCentersUser);

// Activities management
router.post('/:centerId/activities', addActivitiesToCenter);
router.delete('/:centerId/activities', removeActivityFromCenter);

// CRUD operations for authenticated users
router.post('/', 
    uploadSingleImage('image'), // Handle single file upload for 'image' field
    cleanupUploads, // Clean up uploaded files after response
    createCenter
);
router.put('/:id', 
    uploadSingleImage('image'), // Handle single file upload for 'image' field
    cleanupUploads, // Clean up uploaded files after response
    updateCenter 
);
router.delete('/:id', deleteCenter);

module.exports = router;