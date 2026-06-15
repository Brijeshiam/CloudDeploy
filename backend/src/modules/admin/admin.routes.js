'use strict';

/**
 * src/modules/admin/admin.routes.js
 * Admin-only routes — require authenticate + authorize('admin')
 */

const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { listUsers, updateUser, deleteUser, listAllDeployments, getStats } = require('./admin.controller');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/users',              listUsers);
router.patch('/users/:id',        updateUser);
router.delete('/users/:id',       deleteUser);
router.get('/deployments',        listAllDeployments);
router.get('/stats',              getStats);

module.exports = router;
