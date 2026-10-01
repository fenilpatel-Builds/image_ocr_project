const express = require('express');
const DB = require('../db');
const { authenticateToken, requireRole } = require('../auth');

const router = express.Router();

// GET /api/audit/stats - System analytics & OCR processing stats
router.get('/stats', authenticateToken, (req, res) => {
  const stats = DB.getSystemStats();
  res.json({ stats });
});

// GET /api/audit/logs - Audit logs with limit
router.get('/logs', authenticateToken, requireRole('admin', 'auditor'), (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = DB.getAllAuditLogs(limit);
  res.json({ logs });
});

// GET /api/audit/export - Download compliance audit trail as JSON
router.get('/export', authenticateToken, requireRole('admin', 'auditor'), (req, res) => {
  const logs = DB.getAllAuditLogs(1000);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="ocr_audit_trail_${Date.now()}.json"`);
  res.send(JSON.stringify(logs, null, 2));
});

module.exports = router;
