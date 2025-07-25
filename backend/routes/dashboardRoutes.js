// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getGrantMakerStats, getApplicantStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   /api/dashboard

// Grant Maker stats route
router.get('/grantmaker', protect, authorize('Grant Maker', 'Super Admin'), getGrantMakerStats);

// Applicant stats route
router.get('/applicant', protect, authorize('Applicant'), getApplicantStats);

module.exports = router;
