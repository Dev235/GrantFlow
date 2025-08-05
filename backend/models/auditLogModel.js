// backend/models/auditLogModel.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_LOGIN', 'USER_REGISTER', 'USER_CREATED', 'USER_DELETED', 'USER_LOGOUT',
        'USER_PROFILE_UPDATE', 'USER_VERIFIED',
        'GRANT_CREATED', 'GRANT_UPDATED', 'GRANT_DELETED',
        'APPLICATION_SUBMITTED', 'APPLICATION_STATUS_CHANGED', 'APPLICATION_FLAG_CHANGED'
      ],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
