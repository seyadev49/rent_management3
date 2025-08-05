const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, getDashboardStats);

module.exports = router;