'use strict';

/**
 * src/middleware/auth.js
 * Authentication and authorization middleware.
 *
 *  authenticate    — Verify JWT, attach req.user. Fails if no/invalid token.
 *  authorize(...)  — RBAC role check. Must follow authenticate.
 *  optionalAuth    — Attach req.user if token present; silent if missing.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');
const asyncHandler = require('./asyncHandler');
const { error } = require('../utils/apiResponse');

/**
 * authenticate
 * Extracts and verifies the Bearer JWT from the Authorization header.
 * Attaches the full User document to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Also support token in httpOnly cookie (for browser clients)
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return error(res, 'Authentication required. Please provide a valid access token.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Access token has expired. Please refresh your session.', 401);
    }
    return error(res, 'Invalid access token.', 401);
  }

  // Fetch user from DB to ensure they still exist and are active
  const user = await User.findById(decoded.id).select('-password -refreshTokens');
  if (!user) {
    return error(res, 'User associated with this token no longer exists.', 401);
  }

  if (!user.isActive) {
    return error(res, 'Your account has been deactivated. Please contact support.', 403);
  }

  req.user = user;
  next();
});

/**
 * authorize
 * Role-Based Access Control (RBAC).
 * Call AFTER authenticate: router.get('/admin', authenticate, authorize('admin'), handler)
 *
 * @param {...string} roles  Allowed roles (e.g. 'admin', 'user')
 * @returns Express middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
        403
      );
    }

    next();
  };
}

/**
 * optionalAuth
 * Attaches req.user if a valid Bearer token is present.
 * Does NOT fail the request if no token is provided.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(); // no token — proceed without user
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshTokens');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Silently ignore invalid/expired tokens in optional auth
  }

  next();
});

module.exports = { authenticate, authorize, optionalAuth };
