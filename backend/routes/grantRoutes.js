// routes/grantRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getOpenGrants, 
    getMyGrants, 
    getAllGrants, 
    getGrantById, 
    createGrant, 
    updateGrant, 
    deleteGrant,
    getGrantsForReview,
    getGrantsForApproval,
    getReviewCount,
    getApprovalCount
} = require('../controllers/grantController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getOpenGrants);
router.get('/mygrants', protect, authorize('Grant Maker'), getMyGrants);
router.get('/all', protect, authorize('Super Admin'), getAllGrants);
router.get('/review', protect, authorize('Reviewer'), getGrantsForReview);
router.get('/approval', protect, authorize('Approver'), getGrantsForApproval);
router.get('/review/count', protect, authorize('Reviewer'), getReviewCount);
router.get('/approval/count', protect, authorize('Approver'), getApprovalCount);
router.post('/', protect, authorize('Grant Maker'), createGrant);
router.get('/:id', getGrantById);
router.put('/:id', protect, authorize('Grant Maker', 'Super Admin'), updateGrant);
router.delete('/:id', protect, authorize('Grant Maker', 'Super Admin'), deleteGrant);

module.exports = router;

