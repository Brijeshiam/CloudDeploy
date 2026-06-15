'use strict';

/**
 * src/middleware/errorHandler.js
 * Global Express error handler.
 * Must be registered LAST in the middleware chain (after all routes).
 *
 * Handles:
 *  - Mongoose ValidationError
 *  - Mongoose duplicate key (code 11000)
 *  - Mongoose CastError (invalid ObjectId)
 *  - JWT errors (forwarded by auth middleware)
 *  - Generic application errors
 */

const { IS_PRODUCTION } = require('../config/env');

/**
 * errorHandler
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Default error shape
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // ── Mongoose: Document validation error ──────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose: Duplicate key error ────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use.`;
  }

  // ── Mongoose: CastError (invalid ObjectId) ───────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: '${err.value}' is not a valid ID.`;
  }

  // ── JWT: Token errors ────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  // ── Joi: Validation errors from body parsers ─────────────────────────────
  if (err.isJoi) {
    statusCode = 422;
    message = 'Request validation failed.';
    errors = err.details?.map((d) => ({
      field: d.path?.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
  }

  // ── Log server errors ────────────────────────────────────────────────────
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  // ── Build response ───────────────────────────────────────────────────────
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  // Include stack trace only in development for easier debugging
  if (!IS_PRODUCTION && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
