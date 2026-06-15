'use strict';

/**
 * src/modules/admin/admin.controller.js
 * Admin-only operations: user management, cross-tenant deployments, cluster stats.
 */

const User = require('../../models/User');
const Project = require('../../models/Project');
const Deployment = require('../../models/Deployment');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error, paginated } = require('../../utils/apiResponse');

/**
 * GET /api/admin/users
 * List all users with pagination.
 */
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const search = req.query.search?.trim() || '';
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -refreshTokens'),
    User.countDocuments(query),
  ]);

  return paginated(res, users, total, page, limit, 'Users retrieved.');
});

/**
 * PATCH /api/admin/users/:id
 * Update user role or active status.
 */
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;

  // Prevent admins from demoting themselves
  if (req.params.id === req.user._id.toString() && role && role !== 'admin') {
    return error(res, 'You cannot change your own role.', 400);
  }

  const updates = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  if (!user) return error(res, 'User not found.', 404);
  return success(res, user, 'User updated.');
});

/**
 * DELETE /api/admin/users/:id
 * Permanently delete a user and their projects (soft-delete projects).
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return error(res, 'You cannot delete your own account via admin API.', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) return error(res, 'User not found.', 404);

  // Soft-delete all their projects
  await Project.updateMany(
    { userId: req.params.id },
    { $set: { status: 'deleted' } }
  );

  await User.findByIdAndDelete(req.params.id);

  return success(res, null, 'User and associated projects deleted.');
});

/**
 * GET /api/admin/deployments
 * All deployments across all users (admin view).
 */
const listAllDeployments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const status = req.query.status;

  const query = {};
  if (status) query.status = status;

  const [deployments, total] = await Promise.all([
    Deployment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('projectId', 'name slug')
      .populate('userId', 'name email')
      .lean(),
    Deployment.countDocuments(query),
  ]);

  return paginated(res, deployments, total, page, limit, 'Deployments retrieved.');
});

/**
 * GET /api/admin/stats
 * High-level platform statistics.
 */
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalProjects,
    activeProjects,
    totalDeployments,
    runningDeployments,
    failedDeployments,
    deploymentsToday,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Project.countDocuments({ status: { $ne: 'deleted' } }),
    Project.countDocuments({ status: 'active' }),
    Deployment.countDocuments(),
    Deployment.countDocuments({ status: 'running' }),
    Deployment.countDocuments({ status: 'failed' }),
    Deployment.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  return success(
    res,
    {
      users: { total: totalUsers, active: activeUsers },
      projects: { total: totalProjects, active: activeProjects },
      deployments: {
        total: totalDeployments,
        running: runningDeployments,
        failed: failedDeployments,
        today: deploymentsToday,
      },
    },
    'Platform stats retrieved.'
  );
});

module.exports = { listUsers, updateUser, deleteUser, listAllDeployments, getStats };
