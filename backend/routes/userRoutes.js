// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUserProfile, getAllUsers, createUser, deleteUser } = require('../controllers/userControllers'); // Import User model
const { protect, authorize } = require('../middleware/authMiddleware');


router.get('/profile', protect, getUserProfile);
router.get('/', protect, authorize('Super Admin'), getAllUsers);
router.post('/', protect, authorize('Super Admin'), createUser);
router.delete('/:id', protect, authorize('Super Admin'), deleteUser);


module.exports = router;
