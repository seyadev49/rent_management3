const express = require('express');
const { body } = require('express-validator');
const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
} = require('../controllers/propertyController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

const propertyValidation = [
  body('name').notEmpty().withMessage('Property name is required'),
  body('type').isIn(['apartment', 'house', 'shop', 'office']).withMessage('Invalid property type'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
];

router.post('/', authenticateToken, authorize('landlord', 'admin'), propertyValidation, createProperty);
router.get('/', authenticateToken, getProperties);
router.get('/:id', authenticateToken, getPropertyById);
router.put('/:id', authenticateToken, authorize('landlord', 'admin'), propertyValidation, updateProperty);
router.delete('/:id', authenticateToken, authorize('landlord', 'admin'), deleteProperty);

module.exports = router;