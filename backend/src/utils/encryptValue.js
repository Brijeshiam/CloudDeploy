'use strict';

/**
 * src/utils/encryptValue.js
 * AES-256-CBC encryption/decryption for storing secret environment variables.
 *
 * Encrypted format: <iv_hex>:<ciphertext_hex>
 * Key source: ENCRYPTION_KEY env var (64 hex chars = 32 bytes)
 */

const crypto = require('crypto');
const { ENCRYPTION_KEY } = require('../config/env');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // bytes

// Convert hex key to Buffer (32 bytes for AES-256)
const KEY = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * encrypt
 * Encrypts a plaintext string.
 * @param {string} plaintext
 * @returns {string}  "<iv_hex>:<ciphertext_hex>"
 */
function encrypt(plaintext) {
  if (typeof plaintext !== 'string') {
    throw new TypeError('encrypt() expects a string.');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * decrypt
 * Decrypts a value produced by encrypt().
 * @param {string} encryptedValue  "<iv_hex>:<ciphertext_hex>"
 * @returns {string} plaintext
 */
function decrypt(encryptedValue) {
  if (typeof encryptedValue !== 'string') {
    throw new TypeError('decrypt() expects a string.');
  }

  const [ivHex, cipherHex] = encryptedValue.split(':');

  if (!ivHex || !cipherHex) {
    throw new Error('Invalid encrypted value format. Expected "<iv>:<ciphertext>".');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * isEncrypted
 * Simple check to detect if a value looks like an encrypted string.
 * @param {string} value
 * @returns {boolean}
 */
function isEncrypted(value) {
  return typeof value === 'string' && /^[0-9a-f]{32}:[0-9a-f]+$/.test(value);
}

module.exports = { encrypt, decrypt, isEncrypted };
