'use strict';

/**
 * src/utils/generatePublicUrl.js
 * Generates a public HTTPS URL for a deployed project.
 *
 * Format: https://<slug>.<BASE_DOMAIN>
 * Example: https://my-app-a3f9b2.clouddeploy.local
 */

const { BASE_DOMAIN } = require('../config/env');

/**
 * generatePublicUrl
 * @param {string} slug  Project slug (K8s-safe)
 * @returns {string}     Full public HTTPS URL
 */
function generatePublicUrl(slug) {
  if (!slug) throw new Error('Slug is required to generate a public URL.');
  return `https://${slug}.${BASE_DOMAIN}`;
}

module.exports = { generatePublicUrl };
