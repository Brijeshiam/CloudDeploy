'use strict';

/**
 * src/models/Log.js
 * Mongoose model for build, push, deploy, and runtime log entries
 * associated with a specific deployment.
 */

const mongoose = require('mongoose');

// ─── Schema ───────────────────────────────────────────────────────────────────
const logSchema = new mongoose.Schema(
  {
    deploymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deployment',
      required: [true, 'Deployment ID is required.'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required.'],
      index: true,
    },
    level: {
      type: String,
      enum: {
        values: ['info', 'warn', 'error', 'debug'],
        message: 'Level must be info, warn, error, or debug.',
      },
      default: 'info',
    },
    message: {
      type: String,
      required: [true, 'Log message is required.'],
      maxlength: [10000, 'Log message must not exceed 10,000 characters.'],
    },
    source: {
      type: String,
      enum: {
        values: ['build', 'push', 'deploy', 'runtime'],
        message: 'Source must be build, push, deploy, or runtime.',
      },
      required: [true, 'Log source is required.'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // createdAt only (no updatedAt — logs are immutable)
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

// ─── Compound indexes ─────────────────────────────────────────────────────────
logSchema.index({ deploymentId: 1, timestamp: 1 });
logSchema.index({ projectId: 1, source: 1, timestamp: -1 });

// ─── TTL index: auto-delete logs older than 30 days ──────────────────────────
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
