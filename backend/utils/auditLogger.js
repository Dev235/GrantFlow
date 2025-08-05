// backend/utils/auditLogger.js
const AuditLog = require('../models/auditLogModel');

/**
 * Logs an action performed by a user.
 * @param {object} user - The user object performing the action (must have ._id).
 * @param {string} action - The type of action (e.g., 'GRANT_CREATED').
 * @param {object} details - Additional information about the action.
 */
const logAction = async (user, action, details = {}) => {
  try {
    if (!user || !user._id) {
      // For actions where a user might not be available (e.g., initial registration)
      // We can create a placeholder or handle it as needed. For now, we'll log without a user ref if not present.
      console.error('AuditLog: User object with _id is required to log an action.');
    }

    await AuditLog.create({
      user: user ? user._id : null,
      action,
      details,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

module.exports = { logAction };
