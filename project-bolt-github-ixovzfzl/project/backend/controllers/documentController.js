const db = require('../db/connection');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

const uploadDocument = async (req, res) => {
  try {
    const { entityType, entityId, documentName, documentType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const [result] = await db.execute(
      `INSERT INTO documents (organization_id, entity_type, entity_id, document_name, document_type, file_path, file_size, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.organization_id,
        entityType,
        entityId,
        documentName || req.file.originalname,
        documentType || path.extname(req.file.originalname),
        req.file.path,
        req.file.size,
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      documentId: result.insertId,
      fileName: req.file.filename
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { entityType, entityId } = req.query;
    
    let query = `
      SELECT d.*, u.full_name as uploaded_by_name
      FROM documents d
      JOIN users u ON d.uploaded_by = u.id
      WHERE d.organization_id = ? AND d.is_active = TRUE
    `;
    
    const params = [req.user.organization_id];
    
    if (entityType) {
      query += ' AND d.entity_type = ?';
      params.push(entityType);
    }
    
    if (entityId) {
      query += ' AND d.entity_id = ?';
      params.push(entityId);
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const [documents] = await db.execute(query, params);
    
    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Get document info first
    const [documents] = await db.execute(
      'SELECT file_path FROM documents WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = documents[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Mark as inactive in database
    await db.execute(
      'UPDATE documents SET is_active = FALSE WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const [documents] = await db.execute(
      'SELECT * FROM documents WHERE id = ? AND organization_id = ?',
      [id, req.user.organization_id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = documents[0];
    const filePath = document.file_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(filePath, document.document_name);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  upload,
  uploadDocument,
  getDocuments,
  deleteDocument,
  downloadDocument
};