const express = require('express');
const {
  getSubscriptionPlans,
  upgradeSubscription,
  getSubscriptionStatus
} = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/plans', authenticateToken, getSubscriptionPlans);
router.post('/upgrade', authenticateToken, upgradeSubscription);
router.get('/status', authenticateToken, getSubscriptionStatus);

module.exports = router;