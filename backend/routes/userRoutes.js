// routes/userRoutes.js
// Defines user-related routes (e.g., fetching user profiles)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// A placeholder controller function
const getUserProfile = async (req, res) => {
    // In a real app, you'd fetch user data from the database
    // req.user is attached by the 'protect' middleware
    if (req.user) {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getUserProfile);


module.exports = router;
