const express = require('express');
const {
  getSubscriptionPlans,
  upload,
  upgradeSubscription,
  renewSubscription,
  getSubscriptionStatus,
  checkPlanLimits
} = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/plans', authenticateToken, getSubscriptionPlans);
router.post('/upgrade', authenticateToken, upload.single('receipt'), upgradeSubscription);
router.post('/renew', authenticateToken, renewSubscription);
router.get('/status', authenticateToken, getSubscriptionStatus);
router.get('/check-limits/:feature', authenticateToken, checkPlanLimits);

module.exports = router;