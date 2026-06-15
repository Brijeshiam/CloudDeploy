'use strict';

/**
 * src/middleware/requestLogger.js
 * HTTP request logger using Morgan with a custom format.
 * Also creates AuditLog entries for mutating requests (POST/PUT/PATCH/DELETE).
 */

const morgan = require('morgan');
const AuditLog = require('../models/AuditLog');
const { IS_PRODUCTION } = require('../config/env');

// ─── Custom Morgan format ────────────────────────────────────────────────────
// :date :method :url :status :response-time ms - :res[content-length] bytes
morgan.token('user-id', (req) => req.user?._id?.toString() || 'anonymous');
morgan.token('real-ip', (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
);

const MORGAN_FORMAT = IS_PRODUCTION
  ? ':real-ip :user-id :method :url :status :response-time ms'
  : ':method :url :status :response-time ms — :user-id';

/**
 * httpLogger
 * Standard Morgan HTTP request logger.
 */
const httpLogger = morgan(MORGAN_FORMAT, {
  // Skip health-check and metrics endpoints to reduce log noise
  skip: (req) =>
    req.path === '/health' || req.path === '/metrics' || req.path === '/api/metrics',
});

// ─── Mutating request auditor ────────────────────────────────────────────────
const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * auditLogger
 * Creates an AuditLog document for each mutating HTTP request.
 * Runs after the response is sent to avoid slowing down the request.
 */
function auditLogger(req, res, next) {
  if (!AUDITED_METHODS.includes(req.method)) {
    return next();
  }

  // Hook into response finish event
  res.on('finish', () => {
    // Only audit successful (2xx/3xx) and client error (4xx) responses
    // Skip 5xx server errors — they'll be captured in error logs
    if (res.statusCode >= 500) return;

    // Derive action from method + path
    const pathParts = req.path.replace(/^\/api\//, '').split('/').filter(Boolean);
    const resource = pathParts[0]?.toUpperCase() || 'UNKNOWN';
    const methodMap = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    const action = `${methodMap[req.method] || req.method}_${resource}`;

    // Safely extract audit metadata from request body (avoid logging passwords)
    const safeBody = { ...req.body };
    delete safeBody.password;
    delete safeBody.currentPassword;
    delete safeBody.newPassword;
    delete safeBody.confirmPassword;

    // Fire-and-forget audit log creation
    AuditLog.create({
      userId: req.user?._id || null,
      action,
      target: req.params?.id || req.params?.projectId || null,
      targetType: pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1, -1) : null,
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        body: Object.keys(safeBody).length > 0 ? safeBody : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
      },
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((err) => {
      console.error('[AuditLog] Failed to create audit entry:', err.message);
    });
  });

  next();
}

module.exports = { httpLogger, auditLogger };
