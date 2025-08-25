
const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../../middleware/auth');
const {
  getPlatformOverview,
  getUserEngagement,
  getRevenueAnalytics,
  getSystemPerformance,
  getGeographicDistribution
} = require('../../controllers/admin/adminAnalyticsController');

// All admin routes require super admin authentication
router.use(authenticateToken);
router.use(authorize('super_admin'));

// Get platform overview
router.get('/overview', getPlatformOverview);

// Get user engagement analytics
router.get('/engagement', getUserEngagement);

// Get revenue analytics
router.get('/revenue', getRevenueAnalytics);

// Get system performance metrics
router.get('/performance', getSystemPerformance);

// Get geographic distribution
router.get('/geographic', getGeographicDistribution);

module.exports = router;
