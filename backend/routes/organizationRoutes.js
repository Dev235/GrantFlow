// backend/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getOrganizations, 
    getOrganizationMembers, 
    updateOrganizationMember, 
    removeOrganizationMember,
    requestToJoinOrganization,
    getJoinRequests,
    handleJoinRequest,
    addOrganizationMember
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/authMiddleware');


// @route   /api/organizations
router.get('/', getOrganizations);
router.post('/join', protect, authorize('Grant Maker'), requestToJoinOrganization);

router.get('/:id/join-requests', protect, authorize('Grant Maker'), getJoinRequests);
router.put('/join-requests/:requestId', protect, authorize('Grant Maker'), handleJoinRequest);

router.route('/:id/members')
    .get(protect, authorize('Grant Maker', 'Super Admin'), getOrganizationMembers)
    .post(protect, authorize('Grant Maker'), addOrganizationMember);

router.route('/:orgId/members/:memberId')
    .put(protect, authorize('Grant Maker', 'Super Admin'), updateOrganizationMember)
    .delete(protect, authorize('Grant Maker'), removeOrganizationMember);


module.exports = router;
