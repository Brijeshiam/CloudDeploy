'use strict';

/**
 * src/modules/projects/projects.routes.js
 * Mounted at /api/projects — all routes require authentication
 */

const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const { validate, createProjectSchema, updateProjectSchema } = require('./projects.validation');
const {
  listProjects, createProject, getProject,
  updateProject, deleteProject, archiveProject, restoreProject,
} = require('./projects.controller');

// All project routes require auth
router.use(authenticate);

router.get('/',           listProjects);
router.post('/',          validate(createProjectSchema), createProject);
router.get('/:id',        getProject);
router.patch('/:id',      validate(updateProjectSchema), updateProject);
router.delete('/:id',     deleteProject);
router.post('/:id/archive', archiveProject);
router.post('/:id/restore', restoreProject);

module.exports = router;
