# 📄 DocuScan AI — Client-Side Local OCR & Structured Intelligence Platform

[![Local Execution](https://img.shields.io/badge/Local%20OCR-100%25%20WebAssembly-blue.svg)](https://github.com/fenilpatel-Builds/image_ocr_project)
[![Zero Cloud APIs](https://img.shields.io/badge/Privacy-Zero%20Cloud%20APIs-brightgreen.svg)](https://github.com/fenilpatel-Builds/image_ocr_project)
[![Node.js](https://img.shields.io/badge/Node.js-v18%20%7C%20v20%20%7C%20v24-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/Database-Native%20SQLite%20(WAL)-003B57.svg)](https://sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-style document upload, high-performance image preprocessing, browser-side local OCR, and deep structured data extraction platform.

> 🔒 **ARCHITECTURAL GUARANTEE: ZERO THIRD-PARTY OCR APIS**  
> This platform does **NOT** send document images to Google Cloud Vision, AWS Textract, Azure AI Vision, OpenAI Vision, or any paid cloud service.  
> **100% of OCR character recognition and text extraction executes locally on the user's device** using WebAssembly-compiled **Tesseract.js v5** running inside isolated background Web Workers.

---

## 🌟 Key Capabilities

* **100% Client-Side WebAssembly OCR**: Background Web Worker singleton processes documents locally with real-time percentage progress and zero UI thread freezing.
* **Adaptive Canvas Super-Resolution & Preprocessing**:
  * **Sweet-Spot Scaling**: Intelligently upscales low-resolution web thumbnails and mobile photos so character heights hit Tesseract's optimal **25–35px recognition sweet spot**.
  * **Photometric Grayscale**: $Y = 0.299R + 0.587G + 0.114B$ luminance normalization.
  * **Linear Contrast Enhancement**: Midpoint-preserving linear contrast boosting without pixel inversion or clipping.
  * **Laplacian Sharpening & Denoising**: 3×3 convolution filter to emphasize letter boundaries.
  * **Automated Projection Profile Deskew**: Detects and corrects document skew angles from $-10^\circ$ to $+10^\circ$.
* **Dual-Pass OCR Engine**: Automatic Page Segmentation (PSM 3) with smart fallback to Uniform Text Block mode (PSM 6) for paragraphs, reviews, articles, and receipts.
* **Intelligent OCR Repair & Line Cleanser**: Post-processing dictionary fixes common low-resolution OCR confusions while stripping decorative border lines, clipping fragments, and icon noise.
* **Dynamic Post-Scan Document Classifier**: Automatically detects document type *after* scanning based on real recognized content (Invoices, Receipts, Passports, ID Cards, Bank Statements, Purchase Orders, Certificates, and Literature / Prose Reviews).
* **Comprehensive Deep Field & Entity Extraction**:
  * Headings, Titles, and Subtitles
  * Clean continuous Prose & Paragraphs with Opening & Concluding sentences
  * Named Entities (Authors/People, Creative Works/Plays, Venues/Locations, Topics/Subject Matter)
  * Multi-column Key-Value Pairs and Specifications
  * Line Item Tables (Description, Quantity, Unit Price, Total)
  * Financials (Totals, Subtotals, Tax, Discounts, Balances)
  * Contact Info (Emails, Phone Numbers, Addresses, Primary Dates)
  * Document Metrics (Word count, readable line count, reading time)
* **Interactive Human-in-the-Loop Review**: Color-coded confidence badges (High / Medium / Needs Review), inline field editing, custom field creator, and instant JSON/CSV export.
* **Full-Stack Persistence & Security**: Node.js backend with native SQLite (`node:sqlite` WAL mode), JWT authentication, Role-Based Access Control (Admin, Citizen, Auditor), and complete audit trail.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT BROWSER                                   |
|                                                                                   |
|  [Document Input]                                                                 |
|   ├── Drag & Drop File Upload (JPEG, PNG, WEBP, PDF)                              |
|   └── 1-Click Synthetic Sample Generator (Invoice, Passport, Receipt, ID Card)     |
|         │                                                                         |
|         ▼                                                                         |
|  [Canvas Preprocessing Pipeline] (imagePreprocessing.js)                          |
|   ├── Adaptive Super-Resolution Scaling (Sweet-spot 25-35px character height)     |
|   ├── Photometric Grayscale Conversion (0.299R + 0.587G + 0.114B)                 |
|   ├── Linear Contrast Enhancement & Midpoint Normalization                        |
|   ├── 3x3 Laplacian Sharpening & Noise Filtering                                  |
|   └── Projection Profile Variance Deskew Detection (-10° to +10°)                 |
|         │                                                                         |
|         ▼                                                                         |
|  [Local Tesseract.js v5 WebAssembly Engine] (Web Worker Singleton)                |
|   ├── Dual-Pass PSM 3 (Auto) + PSM 6 (Uniform Block) Segmentation                 |
|   ├── Real-time Worker Progress Dispatch (0% -> 100%)                             |
|   └── Bounding Box & Token Confidence Metric Generation                           |
|         │                                                                         |
|         ▼                                                                         |
|  [Post-Scan Document Classifier & Repair] (classifier.js, deepFieldExtractor.js)  |
|   ├── Intelligent OCR Word & Entity Repair Dictionary                             |
|   ├── Stray Border Artifact & Icon Noise Stripping                                |
|   └── Automatic Document Type Classification (Post-Scan)                          |
|         │                                                                         |
|         ▼                                                                         |
|  [Modular Extraction Parsers] (/parsers/)                                         |
|   ├── Invoice Parser (Totals, Tax, GSTIN, Dates, Line Items)                     |
|   ├── Passport Parser (ICAO Doc 9303 7-3-1 Check Digits, DOB, Expiry, Country)   |
|   ├── Receipt Parser (Merchant, Time, Items, Payment Method, Totals)              |
|   ├── ID Card Parser (License#, Name, DOB, Gender, Authority)                     |
|   ├── Bank Statement Parser (Balances, Debits, Credits, Account#)                 |
|   └── Literature / Review / Prose Parser (Author, Work, Venue, Topic, Sentences)  |
|         │                                                                         |
|         ▼                                                                         |
|  [Interactive Verification Form & Review Dashboard]                               |
|   ├── High / Medium / Needs Review Confidence Badges                              |
|   ├── Inline Text Editing & Typo Rectification                                    |
|   ├── Multi-Tab Inspection (Structured Fields, Reading View, Tables, Raw OCR)     |
|   └── JSON & CSV One-Click Export                                                 |
+-----------------------------------------┬-----------------------------------------+
                                          │  HTTP POST /api/documents/:id/verify
                                          ▼
+-----------------------------------------------------------------------------------+
|                        LOCAL BACKEND SERVER (Node.js & Express)                    |
|                                                                                   |
|  [Security & Authentication]                                                      |
|   ├── Role-Based Access Control (Admin, Citizen/User, Auditor)                    |
|   ├── JWT Session Authentication & Token Verification                             |
|   └── File MIME & Size Gatekeeping                                                |
|                                                                                   |
|  [SQLite Database Engine] (Native node:sqlite in WAL Mode)                        |
|   ├── users                      (Auth & RBAC credentials)                        |
|   ├── documents                  (Metadata & lifecycle state)                     |
|   ├── ocr_results                (Verbatim raw text & confidence scores)          |
|   ├── extracted_fields          (Verified structured key-value entities)         |
|   └── document_processing_logs   (Immutable traceability audit trail)             |
+-----------------------------------------------------------------------------------+
```

---

## 🔄 Document Processing Lifecycle

```
UPLOADED  ──►  PROCESSING  ──►  OCR_COMPLETED  ──►  EXTRACTION_COMPLETED
                                                            │
  SAVED   ◄──   VERIFIED   ◄──   NEEDS_REVIEW  ◄────────────┘
    ▲
    └── (FAILED on unreadable input)
```

1. **UPLOADED**: File received and registered with unique ID.
2. **PROCESSING**: Canvas adaptive scaling, grayscale, contrast, and Tesseract Web Worker execution active.
3. **OCR_COMPLETED**: Verbatim raw text extracted with word-level confidence ratings.
4. **EXTRACTION_COMPLETED**: Dynamic post-scan classification and modular deep entity extraction finished.
5. **NEEDS_REVIEW**: Fields with low confidence or validation checks visually flagged.
6. **VERIFIED**: Human operator reviews, validates, or edits values.
7. **SAVED**: Verified record committed to SQLite database with audit log entry.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 18, Vite 6, Vanilla CSS custom design system, Lucide Icons |
| **Local OCR** | Tesseract.js v5 (WebAssembly + Web Worker Singleton) |
| **Image Preprocessing** | HTML5 Canvas (Adaptive Scaling, Grayscale, Linear Contrast, Laplacian Filter, Otsu Binarization, Deskew) |
| **PDF Support** | `pdfjs-dist` (Client-side page rendering to Canvas) |
| **Backend API** | Node.js (v18/v20/v24), Express 4, Multer, JWT, Bcrypt |
| **Database** | SQLite via native Node `node:sqlite` (`DatabaseSync` in WAL mode) |
| **Testing** | Node test runner (`node server/tests/run-tests.js`) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher; recommended v20 or v24)
* **npm**

### 1. Clone the Repository
```bash
git clone https://github.com/fenilpatel-Builds/image_ocr_project.git
cd image_ocr_project
```

### 2. Install Dependencies
```bash
npm run install:all
```
*(Or install manually: `npm install`, `npm install --prefix server`, `npm install --prefix client`)*

### 3. Run Development Servers
```bash
npm run dev
```

This concurrently launches:
* **Frontend Application**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:4000`

---

## 🧪 Testing & Verification

### Automated Test Suite
Run the comprehensive test suite verifying database initialization, JWT authentication, document lifecycle state transitions, RBAC permissions, and ICAO 7-3-1 check digit algorithms:

```bash
npm test
```

Expected output:
```text
✓ Database and Demo Accounts Initialization
✓ Authentication & Role Token Generation
✓ Document Lifecycle (UPLOADED -> OCR -> VERIFIED -> SAVED)
✓ Role-based Document Access Control (RBAC)
✓ ICAO MRZ 7-3-1 Check Digit Algorithm Validation
✓ Security: File MIME and Size boundary specifications
ℹ tests 6 | pass 6 | fail 0
```

### Client Production Build
```bash
npm run build --prefix client
```

---

## 👥 Default Demo Accounts (RBAC)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@example.com` | `admin123` | Full access, system audit trail, analytics, data export |
| **Citizen/User** | `user@example.com` | `user123` | Upload documents, run OCR, review & verify own records |
| **Auditor** | `auditor@example.com` | `auditor123` | Compliance oversight, view all records, inspect audit log |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).