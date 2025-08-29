// backend/routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const { 
    submitApplication, 
    getApplicationsForGrant, 
    getMyApplications, 
    updateApplicationStatus, 
    updateApplicationFlag, 
    scoreApplication 
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   /api/applications

// Applicant: Get all of their own applications
// This specific route must come BEFORE the general '/:id' routes
router.get('/my', protect, authorize('Applicant'), getMyApplications);

// Grant Maker: Get all applications for one of their grants
router.get('/grant/:grantId', protect, authorize('Grant Maker', 'Super Admin'), getApplicationsForGrant);

// Applicant: Submit an application
router.post('/:grantId', protect, authorize('Applicant'), submitApplication);

// Grant Maker: Update the status of an application
router.put('/:id/status', protect, authorize('Grant Maker', 'Super Admin'), updateApplicationStatus);

// Grant Maker: Update the flag of an application
router.put('/:id/flag', protect, authorize('Grant Maker', 'Super Admin'), updateApplicationFlag);

// Grant Maker: Score an application
router.put('/:id/score', protect, authorize('Grant Maker', 'Super Admin'), scoreApplication);


module.exports = router;
