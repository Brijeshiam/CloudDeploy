'use strict';

/**
 * src/modules/auth/auth.controller.js
 * Handles all auth endpoint logic.
 */

const crypto = require('crypto');
const User = require('../../models/User');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error } = require('../../utils/apiResponse');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./auth.service');
const { JWT_REFRESH_SECRET, FRONTEND_URL, JWT_REFRESH_EXPIRES_IN } = require('../../config/env');
const jwt = require('jsonwebtoken');

// ─── Cookie config ────────────────────────────────────────────────────────────
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check for existing account
  const existing = await User.findOne({ email });
  if (existing) {
    return error(res, 'An account with this email already exists.', 409);
  }

  // Create user — password hashed in pre-save hook
  const user = new User({ name, email, password });

  // Generate email verification token (sets fields on user, does NOT save yet)
  const verifyToken = user.generateEmailVerificationToken();

  // Generate JWT tokens (sets fields on user, does NOT save yet)
  const accessToken = user.generateJWT();
  const refreshToken = user.generateRefreshToken();

  // Single save — persists user + verification token + refresh token atomically
  await user.save();

  // Send verification email once (non-blocking; log failure but don't fail request)
  try {
    await sendVerificationEmail(user.email, user.name, verifyToken, FRONTEND_URL);
  } catch (emailErr) {
    console.error('[Auth] Failed to send verification email:', emailErr.message);
  }

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return success(
    res,
    {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
      accessToken,
      refreshToken,
    },
    'Registration successful. Please check your email to verify your account.',
    201
  );
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Fetch user with password (select:false by default)
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user) {
    return error(res, 'Invalid email or password.', 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return error(res, 'Invalid email or password.', 401);
  }

  // Check account active
  if (!user.isActive) {
    return error(res, 'Your account has been deactivated. Contact support.', 403);
  }

  // Warn but don't block unverified accounts (adjust per business requirement)
  const emailVerifiedWarning = !user.isEmailVerified
    ? 'Email not verified. Some features may be restricted.'
    : null;

  // Prune old refresh tokens (keep max 5 active sessions)
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens = user.refreshTokens.slice(-4);
  }

  const accessToken = user.generateJWT();
  const refreshToken = user.generateRefreshToken();
  await user.save();

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return success(
    res,
    {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
      accessToken,
      refreshToken,
      ...(emailVerifiedWarning && { warning: emailVerifiedWarning }),
    },
    'Login successful.'
  );
});

/**
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  // Accept token from body or httpOnly cookie
  const token = req.body.refreshToken || req.cookies?.refreshToken;

  if (!token) {
    return error(res, 'Refresh token is required.', 401);
  }

  // Verify JWT signature
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  } catch {
    return error(res, 'Invalid or expired refresh token.', 401);
  }

  // Check token hash is stored for this user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findById(decoded.id).select('+refreshTokens');

  if (!user || !user.refreshTokens.includes(hashedToken)) {
    return error(res, 'Refresh token has been revoked. Please log in again.', 401);
  }

  // Rotate: remove old, issue new
  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashedToken);
  const newAccessToken = user.generateJWT();
  const newRefreshToken = user.generateRefreshToken();
  await user.save();

  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

  return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token refreshed.');
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      await User.findByIdAndUpdate(decoded.id, {
        $pull: { refreshTokens: hashedToken },
      });
    } catch {
      // Token already invalid — still clear cookie
    }
  }

  res.clearCookie('refreshToken', { path: '/' });
  return success(res, null, 'Logged out successfully.');
});

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return success(res, null, 'If that email exists, a password reset link has been sent.');
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken, FRONTEND_URL);
  } catch (emailErr) {
    // Roll back token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('[Auth] Failed to send reset email:', emailErr.message);
    return error(res, 'Failed to send password reset email. Please try again later.', 500);
  }

  return success(res, null, 'If that email exists, a password reset link has been sent.');
});

/**
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash the incoming token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  }).select('+refreshTokens');

  if (!user) {
    return error(res, 'Password reset token is invalid or has expired.', 400);
  }

  // Update password — pre-save hook will hash it
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  // Invalidate all sessions
  user.refreshTokens = [];
  await user.save();

  res.clearCookie('refreshToken', { path: '/' });

  return success(res, null, 'Password reset successful. Please log in with your new password.');
});

/**
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return error(res, 'Email verification token is invalid or has expired.', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return success(res, null, 'Email verified successfully. You can now access all features.');
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by authenticate middleware
  const user = await User.findById(req.user._id);
  if (!user) {
    return error(res, 'User not found.', 404);
  }

  return success(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
  });
});

/**
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return error(res, 'User not found.', 404);
  }

  user.name = name;
  await user.save();

  return success(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  }, 'Profile updated successfully.');
});

/**
 * PUT /api/auth/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return error(res, 'User not found.', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return error(res, 'Incorrect current password.', 400);
  }

  user.password = newPassword;
  await user.save();

  return success(res, null, 'Password updated successfully.');
});

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, verifyEmail, getMe, updateProfile, changePassword };

