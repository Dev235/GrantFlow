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
router.get('/my', protect, authorize('Applicant'), getMyApplications);

// Grant Maker: Get all applications for one of their grants
router.get('/grant/:grantId', protect, authorize('Grant Maker', 'Super Admin', 'Reviewer', 'Approver'), getApplicationsForGrant);

// Applicant: Submit an application
router.post('/:grantId', protect, authorize('Applicant'), submitApplication);

// Grant Maker & Super Admin: Update the status of an application
// FIX: Removed 'Grant Maker' from authorized roles for changing status. Only Super Admin and Approver can now change it.
router.put('/:id/status', protect, authorize('Super Admin', 'Approver', 'Reviewer'), updateApplicationStatus);

// Grant Maker: Update the flag of an application
router.put('/:id/flag', protect, authorize('Grant Maker', 'Super Admin', 'Reviewer'), updateApplicationFlag);

// Reviewer: Score an application
router.put('/:id/score', protect, authorize('Reviewer'), scoreApplication);


module.exports = router;