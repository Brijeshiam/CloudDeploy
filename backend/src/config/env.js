'use strict';

/**
 * src/config/env.js
 * Loads .env file and validates all required environment variables using Joi.
 * Throws on startup if any required variable is missing or invalid.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Joi = require('joi');

// ─── Validation schema ────────────────────────────────────────────────────────
const envSchema = Joi.object({
  // Server
  PORT: Joi.number().integer().min(1).max(65535).default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // MongoDB
  MONGODB_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),

  // JWT
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Redis
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).default('redis://localhost:6380'),

  // Docker Registry
  DOCKER_REGISTRY: Joi.string().default('docker.io'),
  DOCKER_USERNAME: Joi.string().required(),
  DOCKER_PASSWORD: Joi.string().required(),

  // GitHub
  GITHUB_WEBHOOK_SECRET: Joi.string().required(),

  // Email (SMTP)
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().integer().default(587),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().default('CloudDeploy <noreply@clouddeploy.io>'),

  // Kubernetes
  KUBERNETES_NAMESPACE_PREFIX: Joi.string().default('clouddeploy'),

  // Domain
  BASE_DOMAIN: Joi.string().default('clouddeploy.local'),

  // Repository Storage Path
  REPOS_PATH: Joi.string().default('./repos'),

  // AES-256 encryption key (hex string, 64 chars = 32 bytes)
  ENCRYPTION_KEY: Joi.string().length(64).default('0'.repeat(64)),

  // Prometheus URL (optional)
  PROMETHEUS_URL: Joi.string().uri().default('http://prometheus:9090'),

  // Frontend URL for CORS
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
})
  .unknown(true) // allow extra env vars (e.g. PATH, HOME)
  .required();

// ─── Validate ─────────────────────────────────────────────────────────────────
const { error, value: env } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  const details = error.details.map((d) => `  • ${d.message}`).join('\n');
  console.error('\n❌  Environment variable validation failed:\n' + details + '\n');
  process.exit(1);
}

// ─── Export typed config ──────────────────────────────────────────────────────
module.exports = {
  PORT: env.PORT,
  NODE_ENV: env.NODE_ENV,

  MONGODB_URI: env.MONGODB_URI,

  JWT_SECRET: env.JWT_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN,

  REDIS_URL: env.REDIS_URL,

  DOCKER_REGISTRY: env.DOCKER_REGISTRY,
  DOCKER_USERNAME: env.DOCKER_USERNAME,
  DOCKER_PASSWORD: env.DOCKER_PASSWORD,

  GITHUB_WEBHOOK_SECRET: env.GITHUB_WEBHOOK_SECRET,

  EMAIL_HOST: env.EMAIL_HOST,
  EMAIL_PORT: env.EMAIL_PORT,
  EMAIL_USER: env.EMAIL_USER,
  EMAIL_PASS: env.EMAIL_PASS,
  EMAIL_FROM: env.EMAIL_FROM,

  KUBERNETES_NAMESPACE_PREFIX: env.KUBERNETES_NAMESPACE_PREFIX,

  BASE_DOMAIN: env.BASE_DOMAIN,

  REPOS_PATH: env.REPOS_PATH,

  ENCRYPTION_KEY: env.ENCRYPTION_KEY,

  PROMETHEUS_URL: env.PROMETHEUS_URL,

  FRONTEND_URL: env.FRONTEND_URL,

  IS_PRODUCTION: env.NODE_ENV === 'production',
  IS_DEVELOPMENT: env.NODE_ENV === 'development',
  IS_TEST: env.NODE_ENV === 'test',
};
