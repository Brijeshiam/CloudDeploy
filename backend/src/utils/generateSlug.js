'use strict';

/**
 * src/utils/generateSlug.js
 * Generates a URL-safe slug from a project name with a random suffix
 * to ensure uniqueness within Kubernetes namespace constraints.
 *
 * K8s namespace rules:
 *  - max 63 chars
 *  - lowercase alphanumeric and hyphens only
 *  - must start and end with alphanumeric
 */

const { randomBytes } = require('crypto');

/**
 * generateSlug
 * Converts a name to a lowercase, hyphenated slug with a 6-char random suffix.
 *
 * @param {string} name  Project name (e.g. "My Awesome App!")
 * @returns {string}     URL-safe slug (e.g. "my-awesome-app-a3f9b2")
 */
function generateSlug(name) {
  // 1. Lowercase and replace non-alphanumeric chars with hyphens
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // replace non-alphanumeric sequences with hyphen
    .replace(/^-+|-+$/g, '')       // strip leading/trailing hyphens
    .substring(0, 50);             // leave room for suffix

  // 2. Generate 3-byte random hex suffix (6 chars)
  const suffix = randomBytes(3).toString('hex');

  // 3. Combine and ensure K8s compliance
  const slug = `${base}-${suffix}`;

  // 4. Ensure starts with a letter (K8s requirement)
  if (!/^[a-z]/.test(slug)) {
    return `app-${slug}`.substring(0, 63);
  }

  return slug.substring(0, 63);
}

/**
 * slugifyName
 * Pure slug without random suffix — for display purposes only.
 * @param {string} name
 * @returns {string}
 */
function slugifyName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 63);
}

module.exports = { generateSlug, slugifyName };
