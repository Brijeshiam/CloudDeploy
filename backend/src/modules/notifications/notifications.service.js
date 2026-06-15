'use strict';

/**
 * src/modules/notifications/notifications.service.js
 * Email and Slack notifications for deployment events.
 * Uses the same Nodemailer transporter as auth.service.
 */

const nodemailer = require('nodemailer');
const axios = require('axios');
const User = require('../../models/User');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = require('../../config/env');

// ─── Transporter ──────────────────────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    // No pool — one connection per send, no implicit retries
  });
  return transporter;
}

/**
 * getUserEmail
 * Fetches user email from DB by ID.
 * @param {string} userId
 * @returns {Promise<{ name: string, email: string }|null>}
 */
async function getUserEmail(userId) {
  try {
    const user = await User.findById(userId).select('name email');
    return user ? { name: user.name, email: user.email } : null;
  } catch {
    return null;
  }
}

/**
 * sendEmail
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
async function sendEmail(to, subject, html) {
  const mailer = getTransporter();
  await mailer.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text: html.replace(/<[^>]+>/g, ''),
  });
}

/**
 * sendDeploymentSuccess
 * Sends an email notification when a deployment succeeds.
 * @param {string} userId
 * @param {string} projectName
 * @param {string} url  Public deployment URL
 */
async function sendDeploymentSuccess(userId, projectName, url) {
  const recipient = await getUserEmail(userId);
  if (!recipient) return;

  await sendEmail(
    recipient.email,
    `✅ Deployment Successful — ${projectName}`,
    `
      <h2>🎉 Deployment Successful!</h2>
      <p>Hi ${recipient.name},</p>
      <p>Your project <strong>${projectName}</strong> has been deployed successfully.</p>
      <p>
        <a href="${url}" style="
          background:#16a34a;color:#fff;padding:12px 24px;
          border-radius:6px;text-decoration:none;font-weight:bold;
        ">View Live App</a>
      </p>
      <p>URL: <a href="${url}">${url}</a></p>
      <hr/>
      <small>CloudDeploy — Deploy with confidence.</small>
    `
  );
}

/**
 * sendDeploymentFailure
 * Sends an email notification when a deployment fails.
 * @param {string} userId
 * @param {string} projectName
 * @param {string} errorMessage
 */
async function sendDeploymentFailure(userId, projectName, errorMessage) {
  const recipient = await getUserEmail(userId);
  if (!recipient) return;

  await sendEmail(
    recipient.email,
    `❌ Deployment Failed — ${projectName}`,
    `
      <h2>❌ Deployment Failed</h2>
      <p>Hi ${recipient.name},</p>
      <p>Your deployment for project <strong>${projectName}</strong> has failed.</p>
      <p><strong>Error:</strong></p>
      <pre style="background:#fef2f2;border:1px solid #fca5a5;padding:12px;border-radius:6px;white-space:pre-wrap;">
${errorMessage}
      </pre>
      <p>Please check your deployment logs for more details.</p>
      <hr/>
      <small>CloudDeploy — Deploy with confidence.</small>
    `
  );
}

/**
 * sendSlackNotification
 * Posts a message to a Slack webhook URL.
 * @param {string} webhookUrl  Slack incoming webhook URL
 * @param {string} message     Plain text or markdown message
 */
async function sendSlackNotification(webhookUrl, message) {
  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, { text: message }, { timeout: 5000 });
  } catch (err) {
    console.error('[Notifications] Slack webhook error:', err.message);
  }
}

/**
 * sendSlackDeploymentSuccess
 * Sends a formatted Slack message for deployment success.
 */
async function sendSlackDeploymentSuccess(webhookUrl, projectName, url) {
  await sendSlackNotification(
    webhookUrl,
    `✅ *${projectName}* deployed successfully! 🚀\nURL: ${url}`
  );
}

/**
 * sendSlackDeploymentFailure
 * Sends a formatted Slack message for deployment failure.
 */
async function sendSlackDeploymentFailure(webhookUrl, projectName, errorMessage) {
  await sendSlackNotification(
    webhookUrl,
    `❌ *${projectName}* deployment failed!\nError: ${errorMessage}`
  );
}

module.exports = {
  sendDeploymentSuccess,
  sendDeploymentFailure,
  sendSlackNotification,
  sendSlackDeploymentSuccess,
  sendSlackDeploymentFailure,
};
