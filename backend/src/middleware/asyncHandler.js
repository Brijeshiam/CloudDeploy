'use strict';

/**
 * src/middleware/asyncHandler.js
 * Wraps async route handlers to forward errors to Express error middleware.
 * Eliminates repetitive try/catch blocks in controllers.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }))
 */

/**
 * asyncHandler
 * @param {Function} fn  Async Express route handler
 * @returns {Function}   Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
