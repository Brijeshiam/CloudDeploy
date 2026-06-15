'use strict';

/**
 * src/models/User.js
 * Mongoose model for platform users.
 *
 * Includes instance methods for:
 *  - Password comparison
 *  - JWT / refresh token generation
 *  - Password reset token generation
 *  - Email verification token generation
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = require('../config/env');

// ─── Schema ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [100, 'Name must not exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: { values: ['user', 'admin'], message: 'Role must be user or admin.' },
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpiry: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpiry: {
      type: Date,
      select: false,
    },
    // Array of active refresh token hashes — allows multi-device logout
    refreshTokens: {
      type: [String],
      select: false,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ emailVerificationToken: 1 });

// ─── Pre-save hook: hash password ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────

/**
 * comparePassword
 * Compares a plain-text password against the stored hash.
 * @param {string} plainPassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

/**
 * generateJWT
 * Issues a short-lived access JWT.
 * @returns {string}
 */
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    {
      id: this._id.toString(),
      email: this.email,
      role: this.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * generateRefreshToken
 * Issues a long-lived refresh token and stores its SHA-256 hash in the DB.
 * @returns {string} plain refresh token (send to client)
 */
userSchema.methods.generateRefreshToken = function () {
  const token = jwt.sign(
    { id: this._id.toString() },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  // Store hash so the plain token never lives in the DB
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  this.refreshTokens.push(hashed);

  return token;
};

/**
 * generatePasswordResetToken
 * Creates a secure reset token, stores its hash + expiry.
 * @returns {string} plain token (sent via email)
 */
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return resetToken;
};

/**
 * generateEmailVerificationToken
 * Creates a secure verification token, stores its hash + expiry.
 * @returns {string} plain token (sent via email)
 */
userSchema.methods.generateEmailVerificationToken = function () {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
  this.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verifyToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
