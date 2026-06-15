'use strict';

/**
 * src/modules/github/github.routes.js
 * GitHub webhook route — public (no auth required).
 * Raw body capture is handled in app.js via the verify callback.
 */

const router = require('express').Router();
const { handleWebhook } = require('./github.controller');

// POST /api/webhooks/github — public, no rate limiter (GitHub IPs trusted via HMAC)
router.post('/github', handleWebhook);

module.exports = router;
