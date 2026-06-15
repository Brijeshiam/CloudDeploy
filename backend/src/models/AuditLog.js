'use strict';

/**
 * src/models/AuditLog.js
 * Immutable audit trail for all mutating actions in the platform.
 * Created automatically by the requestLogger middleware for
 * POST/PUT/PATCH/DELETE requests.
 */

const mongoose = require('mongoose');

// ─── Schema ───────────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      // nullable for unauthenticated actions (e.g. register, forgot-password)
    },
    // Human-readable action (e.g. "CREATE_PROJECT", "DELETE_DEPLOYMENT")
    action: {
      type: String,
      required: [true, 'Action is required.'],
      trim: true,
      uppercase: true,
    },
    // ID of the affected resource
    target: {
      type: String,
      trim: true,
    },
    // Type of resource (e.g. "Project", "Deployment", "User")
    targetType: {
      type: String,
      trim: true,
    },
    // Any extra context (request body excerpt, query params, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // No updatedAt — audit logs are immutable
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ targetType: 1, target: 1 });

// ─── TTL index: auto-delete audit logs older than 90 days ────────────────────
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
