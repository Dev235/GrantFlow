// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getGrantMakerStats, getApplicantStats, getSuperAdminStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   /api/dashboard

// Grant Maker stats route
router.get('/grantmaker', protect, authorize('Grant Maker'), getGrantMakerStats);

// Applicant stats route
router.get('/applicant', protect, authorize('Applicant'), getApplicantStats);

// Super Admin stats route
router.get('/superadmin', protect, authorize('Super Admin'), getSuperAdminStats);

module.exports = router;
