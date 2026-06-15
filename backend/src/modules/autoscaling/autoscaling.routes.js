'use strict';

/**
 * src/modules/autoscaling/autoscaling.routes.js
 * Mounted at /api/projects/:id/autoscaling
 */

const router = require('express').Router({ mergeParams: true });
const { authenticate } = require('../../middleware/auth');
const { getAutoscaling, updateAutoscaling, deleteAutoscaling } = require('./autoscaling.controller');

router.use(authenticate);

router.get('/',     getAutoscaling);
router.put('/',     updateAutoscaling);
router.delete('/',  deleteAutoscaling);

module.exports = router;
