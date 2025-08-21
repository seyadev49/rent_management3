
const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../../middleware/auth');
const {
  getAllOrganizations,
  getOrganizationDetails,
  getUserActivityLogs,
  toggleOrganizationStatus,
  resetUserPassword,
  impersonateUser
} = require('../../controllers/admin/adminUserController');

// All admin routes require super admin authentication
router.use(authenticateToken);
router.use(authorize('super_admin'));

// Get all organizations
router.get('/organizations', getAllOrganizations);

// Get organization details
router.get('/organizations/:orgId', getOrganizationDetails);

// Get user activity logs
router.get('/activity-logs', getUserActivityLogs);

// Suspend/Reactivate organization
router.post('/organizations/:orgId/toggle-status', toggleOrganizationStatus);

// Reset user password
router.post('/users/:userId/reset-password', resetUserPassword);

// Impersonate user
router.post('/users/:userId/impersonate', impersonateUser);

module.exports = router;
