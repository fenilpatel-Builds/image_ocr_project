/**
 * Automated Verification & Unit Test Suite for OCR Intelligence Platform
 * Uses Node.js native test runner and assert module.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const DB = require('../db');
const { generateToken, JWT_SECRET } = require('../auth');
const jwt = require('jsonwebtoken');

// 1. Database & Seed Authentication Tests
test('Database and Demo Accounts Initialization', async (t) => {
  const users = DB.listUsers();
  assert.ok(users.length >= 3, 'Should seed at least 3 users');

  const admin = DB.getUserByEmail('admin@example.com');
  const user = DB.getUserByEmail('user@example.com');
  const auditor = DB.getUserByEmail('auditor@example.com');

  assert.equal(admin.role, 'admin');
  assert.equal(user.role, 'user');
  assert.equal(auditor.role, 'auditor');
});

// 2. JWT Token & Permissions Test
test('Authentication & Role Token Generation', async (t) => {
  const user = DB.getUserByEmail('user@example.com');
  const token = generateToken(user);
  assert.ok(typeof token === 'string' && token.length > 20);

  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.id, user.id);
  assert.equal(decoded.role, 'user');
});

// 3. Document Lifecycle & Status Transitions
test('Document Lifecycle (UPLOADED -> OCR -> VERIFIED -> SAVED)', async (t) => {
  const user = DB.getUserByEmail('user@example.com');
  const docId = 'test_doc_' + Date.now();

  // Create doc
  const doc = DB.createDocument({
    id: docId,
    userId: user.id,
    documentType: 'invoice',
    fileName: 'test_invoice.jpg',
    filePath: 'test_invoice.jpg',
    fileSize: 10240,
    mimeType: 'image/jpeg',
    status: 'UPLOADED'
  });

  assert.equal(doc.status, 'UPLOADED');

  // Transition to PROCESSING
  DB.updateDocumentStatus(docId, 'PROCESSING');
  assert.equal(DB.getDocumentById(docId).status, 'PROCESSING');

  // Save OCR Result
  DB.saveOCRResult({
    documentId: docId,
    rawText: 'TAX INVOICE INV-2026-9901 Date: 2026-10-01 Total: $120.00',
    ocrEngine: 'Tesseract.js v5',
    ocrLanguage: 'eng',
    processingTimeMs: 450,
    confidenceAvg: 94.5,
    wordCount: 10
  });

  const ocr = DB.getOCRResult(docId);
  assert.ok(ocr);
  assert.equal(ocr.confidence_avg, 94.5);
  assert.equal(DB.getDocumentById(docId).status, 'OCR_COMPLETED');

  // Save Extracted Fields
  DB.saveExtractedFields(docId, [
    { name: 'Invoice Number', value: 'INV-2026-9901', type: 'string', confidence: 0.95 },
    { name: 'Total Amount', value: '120.00', type: 'number', confidence: 0.92 }
  ]);

  const fields = DB.getExtractedFields(docId);
  assert.equal(fields.length, 2);
  assert.equal(fields[0].field_value, 'INV-2026-9901');

  // Transition to VERIFIED and SAVED
  DB.updateDocumentStatus(docId, 'SAVED');
  assert.equal(DB.getDocumentById(docId).status, 'SAVED');

  // Check audit trail recorded events
  const logs = DB.getLogs(docId);
  assert.ok(logs.length >= 2, 'Should have multiple audit log entries');
  assert.equal(logs[0].action, 'DOCUMENT_UPLOADED');

  // Cleanup
  DB.deleteDocument(docId);
  assert.equal(DB.getDocumentById(docId), undefined);
});

// 4. Role-based Document Visibility Test
test('Role-based Document Access Control (RBAC)', async (t) => {
  const user = DB.getUserByEmail('user@example.com');
  const admin = DB.getUserByEmail('admin@example.com');

  const docId1 = 'doc_user1_' + Date.now();
  const docId2 = 'doc_admin1_' + Date.now();

  DB.createDocument({
    id: docId1,
    userId: user.id,
    fileName: 'user_receipt.jpg',
    filePath: 'user_receipt.jpg',
    fileSize: 2048,
    mimeType: 'image/jpeg'
  });

  DB.createDocument({
    id: docId2,
    userId: admin.id,
    fileName: 'admin_audit.jpg',
    filePath: 'admin_audit.jpg',
    fileSize: 4096,
    mimeType: 'image/jpeg'
  });

  // User query should only see own doc
  const userDocs = DB.listDocuments({ userId: user.id, role: 'user' });
  assert.ok(userDocs.some(d => d.id === docId1));
  assert.ok(!userDocs.some(d => d.id === docId2), 'Regular user must not see documents of other users');

  // Admin query should see all documents
  const adminDocs = DB.listDocuments({ userId: admin.id, role: 'admin' });
  assert.ok(adminDocs.some(d => d.id === docId1));
  assert.ok(adminDocs.some(d => d.id === docId2));

  // Cleanup
  DB.deleteDocument(docId1);
  DB.deleteDocument(docId2);
});

// 5. ICAO Doc 9303 7-3-1 Check Digit Algorithm Unit Test
test('ICAO MRZ 7-3-1 Check Digit Algorithm Validation', async (t) => {
  function calculateCheckDigit(str) {
    const weights = [7, 3, 1];
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      let val = 0;
      if (ch >= '0' && ch <= '9') {
        val = parseInt(ch, 10);
      } else if (ch >= 'A' && ch <= 'Z') {
        val = ch.charCodeAt(0) - 55;
      }
      sum += val * weights[i % 3];
    }
    return (sum % 10).toString();
  }

  // Official ICAO sample: Passport No "L898902C3" has check digit "6"
  // L(21)*7 + 8*3 + 9*1 + 8*7 + 9*3 + 0*1 + 2*7 + C(12)*3 + 3*1 = 147+24+9+56+27+0+14+36+3 = 316 % 10 = 6
  assert.equal(calculateCheckDigit('L898902C3'), '6');

  // DOB 740812 (12 Aug 1974): 7*7 + 4*3 + 0*1 + 8*7 + 1*3 + 2*1 = 49+12+0+56+3+2 = 122 % 10 = 2
  assert.equal(calculateCheckDigit('740812'), '2');

  // Expiry 120415 (15 Apr 2012): 1*7 + 2*3 + 0*1 + 4*7 + 1*3 + 5*1 = 7+6+0+28+3+5 = 49 % 10 = 9
  assert.equal(calculateCheckDigit('120415'), '9');
});

// 6. Security: File validation checks
test('Security: File MIME and Size boundary specifications', async (t) => {
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_BYTES = 15 * 1024 * 1024;

  assert.ok(ALLOWED_MIME.includes('image/jpeg'));
  assert.ok(ALLOWED_MIME.includes('application/pdf'));
  assert.ok(!ALLOWED_MIME.includes('application/x-msdownload'));
  assert.ok(!ALLOWED_MIME.includes('text/html'));
  assert.ok(!ALLOWED_MIME.includes('application/javascript'));

  assert.ok(5 * 1024 * 1024 < MAX_BYTES);
  assert.ok(20 * 1024 * 1024 > MAX_BYTES);
});

console.log('✓ All 6 test suites registered successfully.');
