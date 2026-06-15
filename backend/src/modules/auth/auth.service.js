'use strict';

/**
 * src/modules/auth/auth.service.js
 * Email sending utility using Nodemailer.
 * Called by auth controller to send verification and reset emails.
 */

const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = require('../../config/env');

// ─── Transporter (created lazily) ────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // TLS for port 465
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    // No pool — one connection per send, no implicit retries
  });

  return transporter;
}

/**
 * sendEmail
 * Generic email sender.
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, html, text }) {
  const mailer = getTransporter();

  await mailer.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''), // strip HTML for plain text version
  });
}

/**
 * sendVerificationEmail
 * @param {string} to     Recipient email
 * @param {string} name   Recipient name
 * @param {string} token  Plain verification token
 * @param {string} frontendUrl  Base URL of frontend (for building the link)
 */
async function sendVerificationEmail(to, name, token, frontendUrl) {
  const link = `${frontendUrl}/verify-email/${token}`;

  await sendEmail({
    to,
    subject: 'Verify your CloudDeploy account',
    html: `
      <h2>Welcome to CloudDeploy, ${name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p>
        <a href="${link}" style="
          background:#4F46E5;color:#fff;padding:12px 24px;
          border-radius:6px;text-decoration:none;font-weight:bold;
        ">Verify Email</a>
      </p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <hr/>
      <small>CloudDeploy — Deploy with confidence.</small>
    `,
  });
}

/**
 * sendPasswordResetEmail
 * @param {string} to     Recipient email
 * @param {string} name   Recipient name
 * @param {string} token  Plain reset token
 * @param {string} frontendUrl
 */
async function sendPasswordResetEmail(to, name, token, frontendUrl) {
  const link = `${frontendUrl}/reset-password/${token}`;

  await sendEmail({
    to,
    subject: 'Reset your CloudDeploy password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset for your CloudDeploy account.</p>
      <p>
        <a href="${link}" style="
          background:#DC2626;color:#fff;padding:12px 24px;
          border-radius:6px;text-decoration:none;font-weight:bold;
        ">Reset Password</a>
      </p>
      <p>This link expires in <strong>1 hour</strong>.</p>
      <p>If you didn't request this, you can safely ignore this email. Your password won't change.</p>
      <hr/>
      <small>CloudDeploy — Deploy with confidence.</small>
    `,
  });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
