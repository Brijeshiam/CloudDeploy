'use strict';

/**
 * src/models/Project.js
 * Mongoose model for CloudDeploy projects.
 *
 * Each project maps a GitHub repo to a K8s namespace and deployment.
 * The slug is auto-generated from the name and used as the K8s namespace suffix.
 */

const mongoose = require('mongoose');
const { generateSlug } = require('../utils/generateSlug');

// ─── Schema ───────────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required.'],
      trim: true,
      maxlength: [100, 'Project name must not exceed 100 characters.'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    githubUrl: {
      type: String,
      required: [true, 'GitHub URL is required.'],
      trim: true,
      match: [
        /^https?:\/\/(www\.)?github\.com\/.+\/.+/,
        'Please provide a valid GitHub repository URL.',
      ],
    },
    branch: {
      type: String,
      default: 'main',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'archived', 'deleted'],
        message: 'Status must be active, archived, or deleted.',
      },
      default: 'active',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters.'],
      default: '',
    },
    // Docker image repository (e.g. dockerhubuser/project-slug)
    imageRepository: {
      type: String,
      trim: true,
    },
    // Public URL assigned after first successful deployment
    publicUrl: {
      type: String,
      trim: true,
    },
    // Number of replicas for the K8s Deployment
    replicas: {
      type: Number,
      default: 1,
      min: 0,
      max: 50,
    },
    // Resource limits for containers
    resourceLimits: {
      cpu: { type: String, default: '500m' },
      memory: { type: String, default: '512Mi' },
    },
    // Port the container listens on
    containerPort: {
      type: Number,
      default: 3000,
    },
    // Incremented for each deployment to create versioned image tags
    deploymentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ userId: 1, name: 'text' });

// ─── Pre-save hook: auto-generate slug ───────────────────────────────────────
projectSchema.pre('save', async function (next) {
  if (!this.isNew || this.slug) return next();

  // Generate a URL-safe slug with random suffix to ensure uniqueness
  this.slug = generateSlug(this.name);

  // Also set the default image repository
  const { DOCKER_USERNAME } = require('../config/env');
  if (!this.imageRepository) {
    this.imageRepository = `${DOCKER_USERNAME}/${this.slug}`;
  }

  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
