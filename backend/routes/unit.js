const express = require('express');
const { body } = require('express-validator');
const {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit
} = require('../controllers/unitController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

const unitValidation = [
  body('propertyId').isInt().withMessage('Valid property ID is required'),
  body('unitNumber').notEmpty().withMessage('Unit number is required'),
  body('monthlyRent').isFloat({ min: 0 }).withMessage('Valid monthly rent is required'),
  body('deposit').isFloat({ min: 0 }).withMessage('Valid deposit is required'),
];

router.post('/', authenticateToken, authorize('landlord', 'admin'), unitValidation, createUnit);
router.get('/', authenticateToken, getUnits);
router.get('/:id', authenticateToken, getUnitById);
router.put('/:id', authenticateToken, authorize('landlord', 'admin'), updateUnit);
router.delete('/:id', authenticateToken, authorize('landlord', 'admin'), deleteUnit);

module.exports = router;