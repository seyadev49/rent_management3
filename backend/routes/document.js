const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  upload,
  uploadDocument,
  getDocuments,
  deleteDocument,
  downloadDocument
} = require('../controllers/documentController');

const router = express.Router();

router.get('/', authenticateToken, getDocuments);
router.post('/upload', authenticateToken, upload.single('document'), uploadDocument);
router.get('/download/:id', authenticateToken, downloadDocument);
router.delete('/:id', authenticateToken, deleteDocument);

module.exports = router;