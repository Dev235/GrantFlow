// routes/authRoutes.js
// Defines authentication-related routes

const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// @route   /api/auth
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
