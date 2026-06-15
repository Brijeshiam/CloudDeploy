'use strict';

/**
 * src/app.js
 * Express application factory.
 *
 * Middleware stack:
 *  1. helmet        — security headers
 *  2. cors          — cross-origin resource sharing
 *  3. httpLogger    — Morgan HTTP request logger
 *  4. auditLogger   — AuditLog middleware (mutating requests)
 *  5. rawBody       — capture raw bytes for GitHub webhook HMAC
 *  6. express.json  — JSON body parser
 *  7. apiLimiter    — global rate limiter
 *  8. routes        — all API routes under /api/*
 *  9. /health       — health check endpoint
 * 10. 404 handler   — unknown routes
 * 11. errorHandler  — global error handler (LAST)
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { FRONTEND_URL, IS_PRODUCTION } = require('./config/env');
const { httpLogger, auditLogger } = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes/index');
const { recordRequest } = require('./modules/monitoring/monitoring.service');

const app = express();

// ─── 1. Security headers (helmet) ────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: IS_PRODUCTION, // relax in development for tooling
    crossOriginEmbedderPolicy: IS_PRODUCTION,
  })
);

// ─── 2. CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,                     // allow httpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
  })
);
app.options('*', cors()); // pre-flight

// Trust proxy (for correct IP behind nginx/ingress)
app.set('trust proxy', 1);

// ─── 3. HTTP request logger ───────────────────────────────────────────────────
app.use(httpLogger);

// ─── 4. AuditLog middleware ───────────────────────────────────────────────────
app.use(auditLogger);

// ─── 5. Raw body capture for GitHub webhook HMAC verification ─────────────────
// Must come before express.json so we capture raw bytes.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      // Attach raw body buffer for webhook signature verification
      if (req.path.includes('/webhooks/')) {
        req.rawBody = buf;
      }
    },
    limit: '10mb',
  })
);

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── 6. prom-client metrics middleware ───────────────────────────────────────
// Track response duration for every request
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationSec = Number(durationNs) / 1e9;
    const route = req.route?.path || req.path;
    recordRequest(req.method, route, res.statusCode, durationSec);
  });
  next();
});

// ─── 7. Global API rate limiter ───────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── 8. Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'CloudDeploy API is running.',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── 9. Prometheus metrics endpoint (not under /api) ─────────────────────────
const monitoringRouter = require('./modules/monitoring/monitoring.routes');
app.use('/', monitoringRouter);

// ─── 10. All API routes ───────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 11. 404 handler — unknown routes ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ─── 12. Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
