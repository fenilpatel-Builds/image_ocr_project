# DocuScan AI — Client-Side Local OCR & Structured Intelligence Platform

A production-style document upload, image preprocessing, local OCR, and structured data extraction module integrated into a modern web application architecture.

> **CRITICAL ARCHITECTURAL GUARANTEE: ZERO THIRD-PARTY OCR APIS**  
> This platform does **NOT** use Google Cloud Vision, AWS Textract, Azure AI Vision, OpenAI Vision, or any paid cloud OCR API.  
> **100% of OCR character recognition and text extraction executes locally on the user's device** using WebAssembly-compiled **Tesseract.js** in dedicated background Web Workers.

---

## 1. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                      |
|                                                                                   |
|  [Document Input]                                                                 |
|   ├── Drag & Drop File (JPEG, PNG, WEBP, PDF)                                     |
|   ├── Browser Webcam Capture (MediaDevices API)                                   |
|   └── 1-Click Synthetic Sample Generator (Invoice, Passport, Receipt, ID Card)     |
|         │                                                                         |
|         ▼                                                                         |
|  [Canvas Preprocessing Pipeline] (imagePreprocessing.js)                          |
|   ├── Resizing & Aspect Ratio Normalization                                       |
|   ├── Photometric Grayscale Conversion (0.299R + 0.587G + 0.114B)                 |
|   ├── Contrast Enhancement & Normalization                                        |
|   ├── Sharpening (Laplacian Kernel) & Denoising                                   |
|   ├── Otsu Automated Global Threshold Binarization                               |
|   └── Projection Profile Variance Deskew Detection (-10° to +10°)                 |
|         │                                                                         |
|         ▼                                                                         |
|  [Local Tesseract.js v5 Engine] (WebAssembly + Web Worker Singleton)              |
|   ├── Progress Tracking (Initializing -> Loading Traineddata -> Recognizing)      |
|   └── Character/Word Bounding Box & Token Confidence Metric Generation            |
|         │                                                                         |
|         ├───► [Verbatim Raw OCR Text Panel] (Preserved unmodified)                |
|         │                                                                         |
|         ▼                                                                         |
|  [Rule-Based Heuristic Classifier] (classifier.js)                                |
|   ├── Passport (MRZ token `P<`, `<<<`, 44-char ICAO line detector)               |
|   ├── Invoice ("Tax Invoice", "Bill To", "GSTIN", "Total Due", "Balance")         |
|   ├── Receipt ("Cashier", "Store #", "Subtotal", "Change Due")                    |
|   └── ID Card ("Identity Card", "Driving Licence", "DOB", "Valid Till")           |
|         │                                                                         |
|         ▼                                                                         |
|  [Modular Extraction Parsers] (/parsers/)                                         |
|   ├── Invoice Parser (Totals, Tax, GSTIN, Dates, Line Items)                     |
|   ├── Passport Parser (ICAO Doc 9303 7-3-1 Check Digits, DOB, Expiry, Country)   |
|   ├── Receipt Parser (Merchant, Time, Items, Payment Method, Totals)              |
|   └── ID Card Parser (License#, Name, DOB, Gender, Authority)                     |
|         │                                                                         |
|         ▼                                                                         |
|  [Interactive Verification Form]                                                  |
|   ├── High / Medium / Needs Review Confidence Badges                              |
|   ├── Inline Correction & Manual Typo Rectification                               |
|   └── Custom Field Creation & Validation Checks                                   |
+-----------------------------------------┬-----------------------------------------+
                                          │  HTTP POST /api/documents/:id/verify
                                          ▼
+-----------------------------------------------------------------------------------+
|                        LOCAL BACKEND SERVER (Node.js & Express)                    |
|                                                                                   |
|  [Security & Authentication]                                                      |
|   ├── Role-Based Access Control (Admin, User/Citizen, Auditor)                    |
|   ├── JWT Session Authentication                                                  |
|   └── Secure Storage with MIME & File Size Gatekeeping (Max 15MB)                 |
|                                                                                   |
|  [SQLite Database Engine] (Node 24 Native `node:sqlite` WAL Mode)                 |
|   ├── `users`                      (Auth & RBAC credentials)                      |
|   ├── `documents`                  (Metadata & processing lifecycle state)        |
|   ├── `ocr_results`                (Verbatim raw text & confidence scores)        |
|   ├── `extracted_fields`          (Verified structured key-value entities)       |
|   └── `document_processing_logs`   (Immutable traceability audit trail)           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Document Processing States

The application transitions through eight distinct lifecycle states with visual progress stepper feedback:

```
UPLOADED  ──►  PROCESSING  ──►  OCR_COMPLETED  ──►  EXTRACTION_COMPLETED
                                                            │
  SAVED   ◄──   VERIFIED   ◄──   NEEDS_REVIEW  ◄────────────┘
    ▲
    └── (FAILED on error)
```

1. **UPLOADED**: Original file uploaded and stored securely in backend storage.
2. **PROCESSING**: Image preprocessing (Canvas) and Tesseract Web Worker execution active.
3. **OCR_COMPLETED**: Raw text extracted with word-level confidence ratings.
4. **EXTRACTION_COMPLETED**: Classification and modular parsing succeeded.
5. **NEEDS_REVIEW**: Fields with confidence < 65% or checksum mismatches visually flagged.
6. **VERIFIED**: Human operator reviewed and corrected data.
7. **SAVED**: Verified structured record committed to SQLite database with audit entry.
8. **FAILED**: Gracefully handled fallback if an unreadable image is provided.

---

## 3. Technology Stack

- **Client**: React 18, Vite 6, Tailwind/CSS custom design system, Lucide icons.
- **Local OCR**: `tesseract.js` (v5.1.1) running in a browser Web Worker using WebAssembly.
- **Image Preprocessing**: HTML5 Canvas with custom image processing algorithms (Grayscale, Contrast stretching, Laplacian sharpening, Otsu global binarization, Projection profile deskew).
- **PDF Rendering**: `pdfjs-dist` for local client-side rendering of PDF pages to Canvas.
- **Server**: Node.js v24, Express v4, Multer, JWT, Bcrypt.
- **Database**: SQLite via Node's native `node:sqlite` (`DatabaseSync` in WAL mode — zero external database dependencies!).

---

## 4. Key Implementation Modules

### A. Tesseract.js Web Worker Integration (`client/src/ocr/tesseractService.js`)
- Uses a **Worker Singleton** pattern: initializes the WebAssembly engine once and reuses it for subsequent scans without redownloading or re-instantiating.
- Reports real-time percentage progress (`0% -> 100%`) through the `logger` callback without freezing the UI thread.
- Provides `terminate()` for graceful teardown.

### B. Image Preprocessing Pipeline (`client/src/ocr/imagePreprocessing.js`)
- **Resize**: Bounds images to 2200px max dimension for optimal OCR performance.
- **Grayscale**: Applies standard luminance weights: $Y = 0.299R + 0.587G + 0.114B$.
- **Contrast**: Contrast stretching with factor formula: $\frac{259(C + 255)}{255(259 - C)}$.
- **Otsu Binarization**: Computes optimal threshold maximizing between-class variance.
- **Auto-Deskew**: Calculates horizontal projection profile variance from $-10^\circ$ to $+10^\circ$ to find optimal alignment.

### C. Document Classification (`client/src/ocr/classifier.js`)
- Rule-based keyword and pattern matching:
  - **Passport**: Detects `P<[A-Z]{3}` MRZ pattern or keywords (`REPUBLIC`, `PASSPORT`, `SURNAME`).
  - **Invoice**: Detects `TAX INVOICE`, `BILL TO`, `INVOICE NUMBER`, `SUBTOTAL`, `GSTIN`.
  - **Receipt**: Detects `CASHIER`, `STORE #`, `CHANGE DUE`, `TOTAL`.
  - **ID Card**: Detects `IDENTITY CARD`, `DRIVING LICENCE`, `DOB`, `AADHAAR`.
  - **Certificate**: Detects `THIS IS TO CERTIFY`, `AWARDED TO`.
  - **General**: Fallback for unclassified general text documents.

### D. ICAO Doc 9303 Passport MRZ Parser (`client/src/ocr/parsers/passportParser.js`)
- Parses 2-line 44-character Type 3 Machine Readable Zone (MRZ).
- Implements official ICAO $7-3-1$ check digit verification algorithm modulo 10 on passport number, date of birth, and expiry date.
- Explicitly presents non-authenticity disclaimer: *"OCR extracts text fields and validates checksums; it does not replace biometric border control."*

### E. Commercial Invoice Parser (`client/src/ocr/parsers/invoiceParser.js`)
- Extracts Vendor Name, Invoice #, Invoice Date, Due Date, Customer Name, Address, Email, Phone, Tax/GSTIN ID, Line Items table, Subtotal, Tax %, Discount, and Total.

---

## 5. Running the Application Locally

### Prerequisites
- Node.js (v18 or higher; recommended v24)
- NPM

### Step 1: Install Dependencies
```bash
npm run install:all
```
*(Or individually: `npm install`, `npm install --prefix server`, `npm install --prefix client`)*

### Step 2: Run Development Servers
```bash
npm run dev
```
This concurrently starts:
- **Backend API Server**: `http://localhost:4000`
- **Frontend Vite App**: `http://localhost:5173`

*(On Windows PowerShell, use `npm.cmd run dev` if execution policy restricts PowerShell scripts).*

---

## 6. How to Test & Demonstrate

### Instant 1-Click Evaluation
1. Open `http://localhost:5173/` in your browser.
2. In the upload card under **"Instant Evaluator Demo"**, click **Sample Invoice** or **Sample Passport**.
3. Watch the high-resolution synthetic document render on the client Canvas.
4. Adjust preprocessing options (Grayscale, Contrast, Sharpen, Binarize, Deskew) or leave defaults.
5. Click **"Run Local OCR Engine"**.
6. Observe the animated progress bar tracking Tesseract WebAssembly execution.
7. Inspect the **Verbatim Raw OCR Text** and **Structured Extraction** panels.
8. Edit any field value (e.g. adjust customer name or total) to demonstrate manual correction.
9. Click **"Verify & Save Record"**.
10. Open the **"Documents"** tab to view the persisted record in the SQLite database.
11. Switch the role dropdown to **"Admin"** and click **"Audit & Analytics"** to inspect the complete audit trail and metrics.

### Automated Test Suite
Run the automated unit and integration tests:
```bash
npm test
```
Validates database seeding, JWT authentication, document lifecycle state transitions, RBAC permissions, and ICAO 7-3-1 check digit algorithms.

---

## 7. Extending the System

### Adding a New Document Type
1. Create a parser file in `client/src/ocr/parsers/myDocParser.js`:
   ```javascript
   export function parseMyDoc(rawText, wordTokens = []) {
     return [
       { name: 'My Field', value: 'Extracted Value', type: 'string', confidence: 0.9 }
     ];
   }
   ```
2. Register the parser in `client/src/ocr/parsers/index.js`:
   ```javascript
   import { parseMyDoc } from './myDocParser';
   registerParser('mydoc', parseMyDoc);
   ```
3. Add classification keywords in `client/src/ocr/classifier.js`.

### Adding a New OCR Language
In `client/src/ocr/tesseractService.js`, Tesseract downloads language traineddata on-demand. Simply pass the 3-letter ISO code:
- Spanish: `'spa'`
- French: `'fra'`
- German: `'deu'`
- Hindi: `'hin'`
- Japanese: `'jpn'`

The dropdown in the UI allows instant language selection.

---

## 8. Role-Based Access Control (RBAC)

Pre-seeded demo accounts:
| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@example.com` | `admin123` | View all documents, system audit trail, analytics, data export |
| **Citizen/User** | `user@example.com` | `user123` | Upload documents, run OCR, review & verify own records |
| **Auditor** | `auditor@example.com` | `auditor123` | Compliance oversight, view all documents, inspect audit trail |

Evaluators can switch between roles dynamically using the role dropdown in the top navbar.
#   i m a g e _ o c r _ p r o j e c t  
 