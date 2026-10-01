const express = require('express');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const DB = require('../db');
const { authenticateToken } = require('../auth');

const router = express.Router();

// Ensure storage directory exists
const storageDir = path.join(__dirname, '..', 'storage', 'uploads');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = crypto.randomUUID();
    cb(null, `${Date.now()}-${uniqueId}${ext}`);
  }
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'application/pdf'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.pdf'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, BMP, TIFF, and PDF documents are allowed.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  }
});

// POST /api/documents/upload - Upload a new document file
router.post('/upload', authenticateToken, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds maximum limit of 15MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided.' });
    }

    const docId = 'doc_' + crypto.randomUUID();
    const documentType = req.body.documentType || 'general';

    const newDoc = DB.createDocument({
      id: docId,
      userId: req.user.id,
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'UPLOADED'
    });

    res.status(201).json({
      message: 'Document uploaded successfully.',
      document: newDoc
    });
  });
});

// GET /api/documents - List documents with RBAC filter
router.get('/', authenticateToken, (req, res) => {
  const { status, search } = req.query;
  const docs = DB.listDocuments({
    userId: req.user.id,
    role: req.user.role,
    status,
    search
  });
  res.json({ documents: docs });
});

// GET /api/documents/:id - Retrieve full document with OCR results and audit trail
router.get('/:id', authenticateToken, (req, res) => {
  const doc = DB.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // Access control
  if (req.user.role === 'user' && doc.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied to this document.' });
  }

  const ocrResult = DB.getOCRResult(doc.id);
  const fields = DB.getExtractedFields(doc.id);
  const logs = DB.getLogs(doc.id);

  res.json({
    document: doc,
    ocrResult: ocrResult || null,
    fields: fields || [],
    logs: logs || []
  });
});

// PATCH /api/documents/:id/status - Update document status & classification
router.patch('/:id/status', authenticateToken, (req, res) => {
  const doc = DB.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (req.user.role === 'user' && doc.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { status, documentType, note } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  DB.updateDocumentStatus(doc.id, status, documentType);
  DB.addLog({
    documentId: doc.id,
    action: `STATUS_CHANGED_TO_${status}`,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    details: note || `Status updated to ${status}${documentType ? ` (classified as ${documentType})` : ''}`
  });

  res.json({ message: 'Status updated successfully.', status, documentType });
});

// POST /api/documents/:id/ocr - Save raw OCR text from client
router.post('/:id/ocr', authenticateToken, (req, res) => {
  const doc = DB.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (req.user.role === 'user' && doc.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { rawText, ocrEngine, ocrLanguage, processingTimeMs, confidenceAvg, wordCount } = req.body;

  if (typeof rawText !== 'string') {
    return res.status(400).json({ error: 'rawText must be a string.' });
  }

  DB.saveOCRResult({
    documentId: doc.id,
    rawText,
    ocrEngine,
    ocrLanguage,
    processingTimeMs,
    confidenceAvg,
    wordCount
  });

  DB.updateDocumentStatus(doc.id, 'OCR_COMPLETED');

  DB.addLog({
    documentId: doc.id,
    action: 'OCR_COMPLETED',
    actorUserId: req.user.id,
    actorRole: req.user.role,
    details: {
      engine: ocrEngine || 'Tesseract.js',
      confidenceAvg,
      wordCount,
      processingTimeMs
    }
  });

  res.json({ message: 'OCR results saved successfully.' });
});

// POST /api/documents/:id/fields - Save extracted fields
router.post('/:id/fields', authenticateToken, (req, res) => {
  const doc = DB.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (req.user.role === 'user' && doc.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { fields, documentType, isUserEdited } = req.body;

  if (!Array.isArray(fields)) {
    return res.status(400).json({ error: 'fields must be an array.' });
  }

  DB.saveExtractedFields(doc.id, fields);

  if (documentType) {
    DB.updateDocumentStatus(doc.id, 'EXTRACTION_COMPLETED', documentType);
  } else {
    DB.updateDocumentStatus(doc.id, 'EXTRACTION_COMPLETED');
  }

  DB.addLog({
    documentId: doc.id,
    action: isUserEdited ? 'FIELDS_EDITED_BY_USER' : 'DATA_EXTRACTION_COMPLETED',
    actorUserId: req.user.id,
    actorRole: req.user.role,
    details: {
      fieldCount: fields.length,
      isUserEdited: !!isUserEdited
    }
  });

  res.json({ message: 'Extracted fields saved.', fieldCount: fields.length });
});

// POST /api/documents/:id/verify - Confirm verification and save final record
router.post('/:id/verify', authenticateToken, (req, res) => {
  const doc = DB.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (req.user.role === 'user' && doc.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { fields, documentType } = req.body;

  if (fields && Array.isArray(fields)) {
    // Mark all as verified
    const verifiedFields = fields.map(f => ({ ...f, verified: 1 }));
    DB.saveExtractedFields(doc.id, verifiedFields);
  }

  DB.updateDocumentStatus(doc.id, 'SAVED', documentType);

  DB.addLog({
    documentId: doc.id,
    action: 'DOCUMENT_VERIFIED_AND_SAVED',
    actorUserId: req.user.id,
    actorRole: req.user.role,
    details: {
      verifiedAt: new Date().toISOString(),
      documentType: documentType || doc.document_type
    }
  });

  res.json({ message: 'Document verified and saved successfully in database.' });
});

// GET /api/documents/:id/file - Stream document file securely
router.get('/:id/file', authenticateToken, (req, res) => {
  const doc = DB.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (req.user.role === 'user' && doc.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const filePath = path.join(storageDir, doc.file_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Underlying document file not found on disk.' });
  }

  res.setHeader('Content-Type', doc.mime_type);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
  fs.createReadStream(filePath).pipe(res);
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', authenticateToken, (req, res) => {
  const doc = DB.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (req.user.role === 'user' && doc.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  // Remove physical file
  const filePath = path.join(storageDir, doc.file_path);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('File unlink error:', e);
    }
  }

  DB.deleteDocument(doc.id);
  res.json({ message: 'Document deleted successfully.' });
});

module.exports = router;
