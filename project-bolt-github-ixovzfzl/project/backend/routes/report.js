
const express = require('express');
const router = express.Router();
const { generateReports, exportReport } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, generateReports);
router.get('/export', authenticateToken, exportReport);

module.exports = router;
