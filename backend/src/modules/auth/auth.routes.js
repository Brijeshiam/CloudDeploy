'use strict';

/**
 * src/modules/auth/auth.routes.js
 * Auth router — mounted at /api/auth
 */

const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');
const {
  register, login, refresh, logout,
  forgotPassword, resetPassword, verifyEmail, getMe,
} = require('./auth.controller');
const {
  validate, registerSchema, loginSchema, refreshSchema,
  forgotPasswordSchema, resetPasswordSchema,
} = require('./auth.validation');

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

router.post('/register',        validate(registerSchema),        register);
router.post('/login',           validate(loginSchema),           login);
router.post('/refresh',         validate(refreshSchema),         refresh);
router.post('/logout',                                           logout);
router.post('/forgot-password', validate(forgotPasswordSchema),  forgotPassword);
router.post('/reset-password',  validate(resetPasswordSchema),   resetPassword);
router.get('/verify-email/:token',                               verifyEmail);
router.get('/me',               authenticate,                    getMe);

module.exports = router;
