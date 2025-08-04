// routes/grantRoutes.js
const express = require('express');
const router = express.Router();
const { getOpenGrants, getMyGrants, getGrantById, createGrant, updateGrant, deleteGrant } = require('../controllers/grantController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to get all open grants
router.get('/', getOpenGrants);

// Private route for Grant Makers to get their own created grants
router.get('/mygrants', protect, authorize('Grant Maker', 'Super Admin'), getMyGrants);

// Private route for Grant Makers to create a new grant
router.post('/', protect, authorize('Grant Maker', 'Super Admin'), createGrant);

// Public route to get a single grant by its ID
router.get('/:id', getGrantById);

// Private route for a Grant Maker to update their own grant
router.put('/:id', protect, authorize('Grant Maker', 'Super Admin'), updateGrant);

// Private route for a Grant Maker to delete their own grant
router.delete('/:id', protect, authorize('Grant Maker', 'Super Admin'), deleteGrant);


module.exports = router;
