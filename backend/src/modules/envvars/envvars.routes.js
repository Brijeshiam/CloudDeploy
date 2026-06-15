'use strict';

/**
 * src/modules/envvars/envvars.routes.js
 * Mounted at /api/projects/:projectId/env
 */

const router = require('express').Router({ mergeParams: true });
const { authenticate } = require('../../middleware/auth');
const { listEnvVars, createEnvVar, updateEnvVar, deleteEnvVar, upsertEnvVars, syncEnvVars } = require('./envvars.controller');

router.use(authenticate);

router.get('/',             listEnvVars);
router.post('/',            createEnvVar);
router.put('/',             upsertEnvVars);
router.patch('/:varId',     updateEnvVar);
router.delete('/:varId',    deleteEnvVar);
router.post('/sync',        syncEnvVars);

module.exports = router;
