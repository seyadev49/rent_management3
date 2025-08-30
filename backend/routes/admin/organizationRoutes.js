const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../../middleware/auth');
const {
  createOrganization,
  getAllOrganizations,
  getOrganizationDetails,
  updateOrganizationStatus,
  deleteOrganization
} = require('../../controllers/admin/organizationController');

// All admin routes require super admin authentication
router.use(authenticateToken);
router.use(authorize('super_admin'));

// Create new organization
router.post('/organizations/create', createOrganization);

// Get all organizations
router.get('/organizations', getAllOrganizations);

// Get organization details
router.get('/organizations/:orgId', getOrganizationDetails);

// Update organization status (suspend/reactivate)
router.put('/organizations/:orgId/status', updateOrganizationStatus);

// Delete organization
router.delete('/organizations/:orgId', deleteOrganization);

module.exports = router;