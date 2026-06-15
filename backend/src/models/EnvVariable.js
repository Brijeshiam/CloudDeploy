'use strict';

/**
 * src/models/EnvVariable.js
 * Mongoose model for project environment variables.
 *
 * Secret values (isSecret: true) are stored AES-256 encrypted.
 * The `maskedValue` virtual shows a redacted placeholder for secrets.
 */

const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryptValue');

// ─── Schema ───────────────────────────────────────────────────────────────────
const envVariableSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required.'],
      index: true,
    },
    key: {
      type: String,
      required: [true, 'Key is required.'],
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z_][A-Z0-9_]*$/,
        'Key must be a valid environment variable name (uppercase, underscores, no leading digits).',
      ],
    },
    // Stored plaintext for non-secrets, AES-encrypted for secrets
    value: {
      type: String,
      required: [true, 'Value is required.'],
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound unique index: one key per project ───────────────────────────────
envVariableSchema.index({ projectId: 1, key: 1 }, { unique: true });

// ─── Pre-save hook: encrypt secret values ────────────────────────────────────
envVariableSchema.pre('save', function (next) {
  if (this.isModified('value') && this.isSecret) {
    this.value = encrypt(this.value);
  }
  next();
});

// ─── Instance method: get decrypted value ────────────────────────────────────
/**
 * getPlainValue
 * Returns the decrypted value for secrets, or the plain value otherwise.
 * @returns {string}
 */
envVariableSchema.methods.getPlainValue = function () {
  if (this.isSecret) {
    try {
      return decrypt(this.value);
    } catch {
      return this.value; // fallback (e.g. if value wasn't encrypted)
    }
  }
  return this.value;
};

// ─── Instance method: get masked value ───────────────────────────────────────
/**
 * getMaskedValue
 * Returns a safe representation of the value for API responses.
 * Secrets are shown as "****".
 * @returns {string}
 */
envVariableSchema.methods.getMaskedValue = function () {
  if (this.isSecret) return '****';
  return this.value;
};

// ─── Virtual: displayValue ────────────────────────────────────────────────────
envVariableSchema.virtual('displayValue').get(function () {
  return this.isSecret ? '****' : this.value;
});

// ─── toJSON override: always mask secrets ────────────────────────────────────
envVariableSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    if (ret.isSecret) {
      ret.value = '****';
    }
    return ret;
  },
});

const EnvVariable = mongoose.model('EnvVariable', envVariableSchema);

module.exports = EnvVariable;
