const express = require('express');
const router = express.Router();
const { 
    createTechnology, 
    getAllTechClub, 
    getTechClubById,
    updateTechClub,
    deleteTechClub,
    bulkCreateTechClubs 
} = require('../controllers/TechClub.controller');
const { validateToken } = require('../middleware/auth');
const { validateUserRole } = require('../middleware/roles');

// // Create a new technology club (Admin only)
// router.post('/', createTechnology);

// // Create multiple technology clubs at once (Admin only)
// router.post('/bulk', bulkCreateTechClubs);

// Get all technology clubs (with pagination and search)
router.get(
    '/',
    
    getAllTechClub
);

// Get technology club by ID
router.get(
    '/:id',
    getTechClubById
);

// // Update technology club (Admin only)
// router.put(
//     '/:id',
//     updateTechClub
// );

// // Delete technology club (Admin only)
// router.delete(
//     '/:id',
//     deleteTechClub
// );

module.exports = router;