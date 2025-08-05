const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes - to be implemented
router.get('/', authenticateToken, (req, res) => {
  res.json({ documents: [] });
});

router.post('/', authenticateToken, (req, res) => {
  res.json({ message: 'Document uploaded successfully' });
});

module.exports = router;