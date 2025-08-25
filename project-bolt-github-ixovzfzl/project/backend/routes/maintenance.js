const express = require('express');
const { body } = require('express-validator');
const { checkPlanLimit } = require('../middleware/planLimits');
const {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest
} = require('../controllers/maintenanceController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const maintenanceValidation = [
  body('propertyId').isInt().withMessage('Valid property ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Valid priority is required'),
];

router.post('/', authenticateToken, checkPlanLimit('maintenance_requests'), maintenanceValidation, createMaintenanceRequest);
router.get('/', authenticateToken, getMaintenanceRequests);
router.get('/:id', authenticateToken, getMaintenanceRequestById);
router.put('/:id', authenticateToken, updateMaintenanceRequest);
router.delete('/:id', authenticateToken, deleteMaintenanceRequest);

module.exports = router;