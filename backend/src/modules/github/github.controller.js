'use strict';

/**
 * src/modules/github/github.controller.js
 * GitHub webhook receiver.
 */

const asyncHandler = require('../../middleware/asyncHandler');
const { verifyWebhookSignature, handlePushEvent } = require('./github.service');
const { success, error } = require('../../utils/apiResponse');

/**
 * POST /api/webhooks/github
 * Receives GitHub push events, verifies HMAC signature, triggers deployments.
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  // Verify HMAC signature — req.rawBody set by express.json verify callback
  const rawBody = req.rawBody;
  if (!rawBody) {
    return error(res, 'Raw body not available for signature verification.', 400);
  }

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return error(res, 'Invalid webhook signature.', 401);
  }

  // Only handle push events
  if (event !== 'push') {
    return success(res, null, `Event '${event}' received but not processed.`);
  }

  // Handle push — fire-and-forget to respond quickly to GitHub
  handlePushEvent(req.body)
    .then((result) => {
      if (result.triggered) {
        console.log(`[Webhook] Deployment triggered for project ${result.projectId}`);
      } else {
        console.log(`[Webhook] Push event not processed: ${result.reason}`);
      }
    })
    .catch((err) => {
      console.error('[Webhook] Error handling push event:', err.message);
    });

  // Respond immediately (GitHub expects < 10s response)
  return success(res, null, 'Webhook received and processing started.');
});

module.exports = { handleWebhook };
