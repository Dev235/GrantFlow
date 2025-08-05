// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile, 
    getAllUsers, 
    createUser, 
    deleteUser,
    verifyUser,
    resetUserPassword // <-- Import new function
} = require('../controllers/userControllers');
const { protect, authorize } = require('../middleware/authMiddleware');

// Routes for individual user's own profile
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Routes for admin-level user management
router.route('/')
    .get(protect, authorize('Super Admin'), getAllUsers)
    .post(protect, authorize('Super Admin'), createUser);

router.route('/:id')
    .delete(protect, authorize('Super Admin'), deleteUser);

router.route('/:id/verify')
    .put(protect, authorize('Super Admin'), verifyUser);

// --- NEW ROUTE ---
router.route('/:id/reset-password')
    .put(protect, authorize('Super Admin'), resetUserPassword);


module.exports = router;
