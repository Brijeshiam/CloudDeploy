'use strict';

/**
 * src/models/Deployment.js
 * Mongoose model for individual deployments of a project.
 *
 * Each time a user triggers a deploy (manually or via webhook),
 * a new Deployment document is created. Version is auto-incremented per project.
 */

const mongoose = require('mongoose');

// ─── Schema ───────────────────────────────────────────────────────────────────
const deploymentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required.'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
      index: true,
    },
    // Sequential version number per project (1, 2, 3, …)
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    // Full Docker image URL: registry/repo:tag (e.g. docker.io/user/myapp:v5)
    imageTag: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['queued', 'building', 'pushing', 'deploying', 'running', 'failed', 'stopped'],
        message: 'Invalid deployment status.',
      },
      default: 'queued',
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    // Duration in milliseconds from startedAt to completedAt
    duration: {
      type: Number,
    },
    triggeredBy: {
      type: String,
      enum: {
        values: ['manual', 'webhook', 'auto'],
        message: 'triggeredBy must be manual, webhook, or auto.',
      },
      default: 'manual',
    },
    commitSha: {
      type: String,
      trim: true,
    },
    commitMessage: {
      type: String,
      trim: true,
    },
    // Error message if deployment failed
    error: {
      type: String,
    },
    // Public URL once deployment is running
    publicUrl: {
      type: String,
    },
    // BullMQ job ID for tracking
    jobId: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound indexes ─────────────────────────────────────────────────────────
deploymentSchema.index({ projectId: 1, version: -1 });
deploymentSchema.index({ projectId: 1, status: 1 });
deploymentSchema.index({ userId: 1, createdAt: -1 });

// ─── Virtual: isTerminal ──────────────────────────────────────────────────────
deploymentSchema.virtual('isTerminal').get(function () {
  return ['running', 'failed', 'stopped'].includes(this.status);
});

// ─── Pre-save: calculate duration ────────────────────────────────────────────
deploymentSchema.pre('save', function (next) {
  if (this.startedAt && this.completedAt) {
    this.duration = this.completedAt.getTime() - this.startedAt.getTime();
  }
  next();
});

/**
 * Static: nextVersion
 * Returns the next sequential deployment version for a given project.
 * @param {string} projectId
 * @returns {Promise<number>}
 */
deploymentSchema.statics.nextVersion = async function (projectId) {
  const last = await this.findOne({ projectId }).sort({ version: -1 }).select('version');
  return last ? last.version + 1 : 1;
};

const Deployment = mongoose.model('Deployment', deploymentSchema);

module.exports = Deployment;
