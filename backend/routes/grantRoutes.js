// routes/grantRoutes.js
const express = require('express');
const router = express.Router();
const { getOpenGrants, getMyGrants, getAllGrants, getGrantById, createGrant, updateGrant, deleteGrant } = require('../controllers/grantController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to get all open grants
router.get('/', getOpenGrants);

// Private route for Grant Makers to get their own created grants
router.get('/mygrants', protect, authorize('Grant Maker'), getMyGrants);

// Private route for Super Admins to get all grants
router.get('/all', protect, authorize('Super Admin'), getAllGrants);

// Private route for Grant Makers to create a new grant
router.post('/', protect, authorize('Grant Maker'), createGrant);

// Public route to get a single grant by its ID
router.get('/:id', getGrantById);

// Private route for a Grant Maker or Super Admin to update a grant
router.put('/:id', protect, authorize('Grant Maker', 'Super Admin'), updateGrant);

// Private route for a Grant Maker or Super Admin to delete a grant
router.delete('/:id', protect, authorize('Grant Maker', 'Super Admin'), deleteGrant);


module.exports = router;
