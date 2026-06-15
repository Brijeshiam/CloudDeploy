'use strict';

/**
 * src/modules/projects/projects.validation.js
 * Joi schemas for project endpoints.
 */

const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return res.status(422).json({ success: false, message: 'Validation failed.', errors });
    }
    req.body = value;
    next();
  };
}

const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  githubUrl: Joi.string()
    .uri({ scheme: ['https', 'http'] })
    .pattern(/github\.com/)
    .required()
    .messages({ 'string.pattern.base': 'Must be a valid GitHub repository URL.' }),
  branch: Joi.string().trim().default('main'),
  description: Joi.string().trim().max(500).allow('').default(''),
  containerPort: Joi.number().integer().min(1).max(65535).default(3000),
  replicas: Joi.number().integer().min(1).max(50).default(1),
  resourceLimits: Joi.object({
    cpu: Joi.string().default('500m'),
    memory: Joi.string().default('512Mi'),
  }).default({ cpu: '500m', memory: '512Mi' }),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow(''),
  branch: Joi.string().trim(),
  containerPort: Joi.number().integer().min(1).max(65535),
  replicas: Joi.number().integer().min(0).max(50),
  resourceLimits: Joi.object({
    cpu: Joi.string(),
    memory: Joi.string(),
  }),
}).min(1);

module.exports = { validate, createProjectSchema, updateProjectSchema };
