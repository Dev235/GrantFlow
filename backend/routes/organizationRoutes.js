// backend/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getOrganizations, 
    getOrganizationMembers,
    createOrganization, // Add new function to destructuring
    updateOrganizationMember, 
    removeOrganizationMember,
    requestToJoinOrganization,
    getJoinRequests,
    handleJoinRequest,
    addOrganizationMember
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/authMiddleware');


// @route   GET /api/organizations
router.get('/', getOrganizations);

// @route   POST /api/organizations/create (NEW ROUTE)
router.post('/create', protect, authorize('Grant Maker'), createOrganization);

// @route   POST /api/organizations/join
router.post('/join', protect, authorize('Grant Maker'), requestToJoinOrganization);

// @route   GET /api/organizations/:id/join-requests
router.get('/:id/join-requests', protect, authorize('Grant Maker', 'Super Admin'), getJoinRequests);

// @route   PUT /api/organizations/join-requests/:requestId
router.put('/join-requests/:requestId', protect, authorize('Grant Maker', 'Super Admin'), handleJoinRequest);

// @route   /api/organizations/:id/members
// Everyone in org can view members
router.get('/:id/members', protect, authorize('Reviewer', 'Approver', 'Grant Maker', 'Super Admin'), getOrganizationMembers);

// Only Grant Maker + Super Admin can add members
router.post('/:id/members', protect, authorize('Grant Maker', 'Super Admin'), addOrganizationMember);

// @route   /api/organizations/:orgId/members/:memberId
// Only Grant Maker + Super Admin can update/remove members
router.put('/:orgId/members/:memberId', protect, authorize('Grant Maker', 'Super Admin'), updateOrganizationMember);
router.delete('/:orgId/members/:memberId', protect, authorize('Grant Maker', 'Super Admin'), removeOrganizationMember);

module.exports = router;
