const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

// Ensure db directory exists
const dbPath = path.join(__dirname, 'data', 'ocr_system.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for durability and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'auditor')) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      document_type TEXT DEFAULT 'general',
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN (
        'UPLOADED', 'PROCESSING', 'OCR_COMPLETED',
        'EXTRACTION_COMPLETED', 'NEEDS_REVIEW', 'VERIFIED',
        'SAVED', 'FAILED'
      )) DEFAULT 'UPLOADED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ocr_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      ocr_engine TEXT DEFAULT 'Tesseract.js-v5 (Local WebAssembly/Worker)',
      ocr_language TEXT DEFAULT 'eng',
      processing_time_ms INTEGER DEFAULT 0,
      confidence_avg REAL DEFAULT 0.0,
      word_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extracted_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_value TEXT,
      field_type TEXT DEFAULT 'string',
      confidence REAL DEFAULT 1.0,
      verified INTEGER DEFAULT 0,
      user_edited INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_processing_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_user_id INTEGER,
      actor_role TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_docs_user ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_docs_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_fields_doc ON extracted_fields(document_id);
    CREATE INDEX IF NOT EXISTS idx_logs_doc ON document_processing_logs(document_id);
  `);

  // Seed default demo users if not present
  seedDefaultUsers();
}

function seedDefaultUsers() {
  const check = db.prepare('SELECT count(*) as count FROM users').get();
  if (check.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = (pw) => bcrypt.hashSync(pw, salt);

    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    );

    insertUser.run('System Administrator', 'admin@example.com', hash('admin123'), 'admin');
    insertUser.run('Standard Citizen/User', 'user@example.com', hash('user123'), 'user');
    insertUser.run('Compliance Auditor', 'auditor@example.com', hash('auditor123'), 'auditor');

    console.log('✓ Seeded default demo accounts: admin@example.com, user@example.com, auditor@example.com');
  }
}

// Helper query wrappers
const DB = {
  db,
  initDatabase,

  // Users
  getUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },
  getUserById(id) {
    return db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
  },
  createUser(name, email, passwordHash, role = 'user') {
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, passwordHash, role);
    return result.lastInsertRowid;
  },
  listUsers() {
    return db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC').all();
  },

  // Documents
  createDocument({ id, userId, documentType = 'general', fileName, filePath, fileSize, mimeType, status = 'UPLOADED' }) {
    db.prepare(`
      INSERT INTO documents (id, user_id, document_type, file_name, file_path, file_size, mime_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, documentType || 'general', fileName, filePath, fileSize, mimeType, status);

    this.addLog({
      documentId: id,
      action: 'DOCUMENT_UPLOADED',
      actorUserId: userId,
      details: JSON.stringify({ fileName, fileSize, mimeType, documentType: documentType || 'general' })
    });

    return this.getDocumentById(id);
  },

  getDocumentById(id) {
    return db.prepare(`
      SELECT d.*, u.name as user_name, u.email as user_email
      FROM documents d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(id);
  },

  listDocuments({ userId = null, role = 'user', status = null, search = null }) {
    let sql = `
      SELECT d.*, u.name as user_name, u.email as user_email,
             (SELECT count(*) FROM extracted_fields WHERE document_id = d.id) as field_count,
             (SELECT confidence_avg FROM ocr_results WHERE document_id = d.id ORDER BY id DESC LIMIT 1) as avg_confidence
      FROM documents d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based visibility: standard users only see their own docs; admin/auditor see all
    if (role === 'user' && userId) {
      sql += ' AND d.user_id = ?';
      params.push(userId);
    }

    if (status && status !== 'ALL') {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (d.file_name LIKE ? OR d.document_type LIKE ? OR u.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY d.created_at DESC';
    return db.prepare(sql).all(...params);
  },

  updateDocumentStatus(id, status, documentType = null) {
    if (documentType) {
      db.prepare(`
        UPDATE documents SET status = ?, document_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(status, documentType, id);
    } else {
      db.prepare(`
        UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(status, id);
    }

    this.addLog({
      documentId: id,
      action: `STATUS_CHANGED_TO_${status}`,
      details: `Status changed to ${status}${documentType ? ` (${documentType})` : ''}`
    });
  },

  deleteDocument(id) {
    return db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  },

  // OCR Results
  saveOCRResult({ documentId, rawText, ocrEngine, ocrLanguage, processingTimeMs, confidenceAvg, wordCount }) {
    db.prepare(`
      INSERT INTO ocr_results (document_id, raw_text, ocr_engine, ocr_language, processing_time_ms, confidence_avg, word_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      documentId,
      rawText,
      ocrEngine || 'Tesseract.js-v5 (Local Browser WebAssembly)',
      ocrLanguage || 'eng',
      processingTimeMs || 0,
      confidenceAvg || 0.0,
      wordCount || 0
    );

    this.updateDocumentStatus(documentId, 'OCR_COMPLETED');
  },

  getOCRResult(documentId) {
    return db.prepare('SELECT * FROM ocr_results WHERE document_id = ? ORDER BY id DESC LIMIT 1').get(documentId);
  },

  // Extracted Fields
  saveExtractedFields(documentId, fields = []) {
    // Clean old fields if re-extracting
    db.prepare('DELETE FROM extracted_fields WHERE document_id = ?').run(documentId);

    const insert = db.prepare(`
      INSERT INTO extracted_fields (document_id, field_name, field_value, field_type, confidence, verified, user_edited)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const f of fields) {
      insert.run(
        documentId,
        f.name || f.field_name,
        String(f.value ?? f.field_value ?? ''),
        f.type || f.field_type || 'string',
        f.confidence ?? 1.0,
        f.verified ? 1 : 0,
        f.user_edited ? 1 : 0
      );
    }
  },

  getExtractedFields(documentId) {
    return db.prepare('SELECT * FROM extracted_fields WHERE document_id = ? ORDER BY id ASC').all(documentId);
  },

  // Audit Logs
  addLog({ documentId, action, actorUserId = null, actorRole = null, details = null }) {
    db.prepare(`
      INSERT INTO document_processing_logs (document_id, action, actor_user_id, actor_role, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(documentId, action, actorUserId, actorRole, typeof details === 'object' ? JSON.stringify(details) : details);
  },

  getLogs(documentId) {
    return db.prepare(`
      SELECT l.*, u.name as actor_name, u.email as actor_email
      FROM document_processing_logs l
      LEFT JOIN users u ON l.actor_user_id = u.id
      WHERE l.document_id = ?
      ORDER BY l.created_at ASC
    `).all(documentId);
  },

  getAllAuditLogs(limit = 100) {
    return db.prepare(`
      SELECT l.*, d.file_name, d.document_type, u.name as actor_name, u.email as actor_email
      FROM document_processing_logs l
      LEFT JOIN documents d ON l.document_id = d.id
      LEFT JOIN users u ON l.actor_user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT ?
    `).all(limit);
  },

  getSystemStats() {
    const totalDocs = db.prepare('SELECT count(*) as count FROM documents').get().count;
    const verifiedDocs = db.prepare("SELECT count(*) as count FROM documents WHERE status = 'VERIFIED' OR status = 'SAVED'").get().count;
    const pendingReview = db.prepare("SELECT count(*) as count FROM documents WHERE status = 'NEEDS_REVIEW' OR status = 'OCR_COMPLETED'").get().count;
    const totalUsers = db.prepare('SELECT count(*) as count FROM users').get().count;
    const avgConfidence = db.prepare('SELECT avg(confidence_avg) as avg FROM ocr_results').get().avg || 0;

    const docsByType = db.prepare(`
      SELECT document_type, count(*) as count
      FROM documents
      GROUP BY document_type
    `).all();

    const recentActivity = db.prepare(`
      SELECT l.action, l.created_at, d.file_name, d.document_type, u.name as actor_name
      FROM document_processing_logs l
      LEFT JOIN documents d ON l.document_id = d.id
      LEFT JOIN users u ON l.actor_user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `).all();

    return {
      totalDocs,
      verifiedDocs,
      pendingReview,
      totalUsers,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      docsByType,
      recentActivity
    };
  }
};

initDatabase();

module.exports = DB;
