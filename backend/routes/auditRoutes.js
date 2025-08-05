// backend/routes/auditRoutes.js
const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   /api/audit
router.get('/', protect, authorize('Super Admin'), getAuditLogs);

module.exports = router;
