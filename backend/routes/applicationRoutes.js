// routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const { submitApplication, getApplicationsForGrant, getMyApplications, updateApplicationStatus } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   /api/applications

// Applicant: Submit an application
router.post('/:grantId', protect, authorize('Applicant'), submitApplication);

// Applicant: Get all of their own applications
router.get('/my', protect, authorize('Applicant'), getMyApplications);

// Grant Maker: Get all applications for one of their grants
router.get('/grant/:grantId', protect, authorize('Grant Maker', 'Super Admin'), getApplicationsForGrant);

// Grant Maker: Update the status of an application
router.put('/:id/status', protect, authorize('Grant Maker', 'Super Admin'), updateApplicationStatus);

module.exports = router;
