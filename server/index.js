const express = require('express');
const cors = require('cors');
const path = require('node:path');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const auditRoutes = require('./routes/audit');
const DB = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Local Tesseract.js (Client-Side WASM)',
    database: 'SQLite (Node.js native)',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 OCR Platform API Server listening on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`🔒 Authentication: JWT / Role-Based Access Control`);
  console.log(`📁 Database: SQLite (Native WAL mode)`);
  console.log(`⚡ OCR Engine: Client-Side Tesseract.js (Zero 3rd-party API)`);
  console.log(`=======================================================`);
});

module.exports = app;
