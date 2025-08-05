const express = require('express');
const { body } = require('express-validator');
const {
  createPayment,
  getPayments,
  updatePaymentStatus,
  deletePayment,
  generateOverduePayments
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const paymentValidation = [
  body('contractId').isInt().withMessage('Valid contract ID is required'),
  body('tenantId').isInt().withMessage('Valid tenant ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('paymentDate').isISO8601().withMessage('Valid payment date is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
];

router.post('/', authenticateToken, paymentValidation, createPayment);
router.get('/', authenticateToken, getPayments);
router.put('/:id/status', authenticateToken, updatePaymentStatus);
router.delete('/:id', authenticateToken, deletePayment);
router.post('/generate-overdue', authenticateToken, generateOverduePayments);

module.exports = router;