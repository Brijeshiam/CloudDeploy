'use strict';

/**
 * src/middleware/rateLimiter.js
 * Configures multiple express-rate-limit instances for different endpoints.
 *
 *  authLimiter   — strict: 5 requests per 15 minutes (login, register)
 *  apiLimiter    — general: 100 requests per minute
 *  deployLimiter — 10 deployment triggers per 5 minutes
 */

const rateLimit = require('express-rate-limit');
const { error } = require('../utils/apiResponse');

/**
 * createLimiter
 * Helper factory for consistent rate limiter creation.
 */
function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
      return error(
        res,
        message || 'Too many requests. Please try again later.',
        429
      );
    },
    keyGenerator: (req) => {
      // Use X-Forwarded-For when behind a proxy, otherwise remote IP
      return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    },
  });
}

/**
 * authLimiter
 * Protects: POST /api/auth/login, POST /api/auth/register, POST /api/auth/forgot-password
 * 100 requests per 15 minutes in development, 5 in production.
 */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

/**
 * apiLimiter
 * General API rate limit: 100 requests per minute per IP.
 */
const apiLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Rate limit exceeded. Please slow down your requests.',
});

/**
 * deployLimiter
 * Protects: POST /api/projects/:id/deploy
 * 10 triggers per 5 minutes per IP.
 */
const deployLimiter = createLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: 'Too many deployment requests. Please wait before triggering another deployment.',
});

module.exports = { authLimiter, apiLimiter, deployLimiter };
