# 📄 DocuScan AI — Client-Side Local OCR & Trilingual Intelligence Platform

[![Local Execution](https://img.shields.io/badge/Local%20OCR-100%25%20WebAssembly-blue.svg)](https://github.com/fenilpatel-Builds/image_ocr_project)
[![Zero Cloud APIs](https://img.shields.io/badge/Privacy-Zero%20Cloud%20APIs-brightgreen.svg)](https://github.com/fenilpatel-Builds/image_ocr_project)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20%E0%AA%97%E0%AB%81%E0%AA%9C%E0%AA%B0%E0%AA%BE%E0%AA%A4%E0%AB%80%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-orange.svg)](https://github.com/fenilpatel-Builds/image_ocr_project)
[![Node.js](https://img.shields.io/badge/Node.js-v18%20%7C%20v20%20%7C%20v24-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/Database-Native%20SQLite%20(WAL)-003B57.svg)](https://sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Creator](https://img.shields.io/badge/Developer-Fenil%20Patel-blueviolet.svg)](https://github.com/fenilpatel-Builds)

A high-performance, enterprise-grade document capture, image preprocessing, browser-side local OCR, and deep structured data extraction platform.

> 🔒 **ARCHITECTURAL GUARANTEE: ZERO THIRD-PARTY CLOUD OCR APIS**  
> This platform does **NOT** transmit document images or scans to Google Cloud Vision, AWS Textract, Azure AI Vision, OpenAI Vision, or any external cloud service.  
> **100% of OCR character recognition and text extraction executes locally on your device** using WebAssembly-compiled **Tesseract.js v5** running inside isolated background Web Workers.

---

## 🌟 Key Capabilities

* **🌐 Automatic Multilingual OCR (English + ગુજરાતી + हिन्दी)**:
  * Seamless, zero-configuration recognition running `hin+guj+eng` simultaneously in a single pass.
  * No manual language dropdowns needed — automatically detects and extracts English, Gujarati, and Hindi scripts from the same bill or document.
  * Native support for Indian numerals (Gujarati `[૦-૯]` and Devanagari `[०-९]`) mapped automatically to standard digits.

* **📷 Direct Camera Scanning & Viewfinder**:
  * Real-time device camera modal with live viewfinder and document alignment guides.
  * 1-click snapshot capture with adaptive contrast enhancement and sharpening optimized for mobile/webcam photos.

* **⚡ Adaptive Canvas Super-Resolution & Preprocessing**:
  * **Sweet-Spot Scaling**: Intelligently upscales low-resolution web thumbnails and camera photos so character heights hit Tesseract's optimal **25–35px recognition sweet spot**.
  * **Photometric Grayscale**: $Y = 0.299R + 0.587G + 0.114B$ luminance normalization.
  * **Linear Contrast Enhancement**: Midpoint-preserving linear contrast boosting without pixel inversion or clipping.
  * **Laplacian Sharpening & Denoising**: 3×3 convolution filter to emphasize letter boundaries.
  * **Automated Projection Profile Deskew**: Detects and corrects document skew angles from $-10^\circ$ to $+10^\circ$.

* **🧠 Dual-Pass OCR Engine**:
  * Automatic Page Segmentation (PSM 3) with smart fallback to Uniform Text Block mode (PSM 6) for dense paragraphs, receipts, and multi-column invoices.

* **🏷️ Dynamic Post-Scan Document Classifier**:
  * Automatically detects document categories *after* scanning based on recognized semantic tokens:
    * Commercial Bills & Tax Invoices (`कर इनवॉइस`, `ઇન્વોઇસ`)
    * Retail / Cafe Receipts (`रसीद`, `બિલ`)
    * Passports (ICAO Doc 9303 MRZ 7-3-1 check digit validation)
    * Identity Cards & Driver Licenses
    * Bank Statements (`स्टेटमेंट`)
    * Purchase / Sales Orders (`आदेश`, `ઓર્ડર`)
    * Prose & Literature Reviews

* **📊 Comprehensive Deep Entity Extraction**:
  * Trilingual Store Names & Corporate Entities
  * Document Numbering, GSTIN (`24AAACB...`), and Dates
  * Trilingual Line Item Tables (Description, Quantity, Unit Rate, Total)
  * Financial Totals (Subtotal, GST/Taxes, Grand Total)
  * Customer & Vendor Contact Information (Names, Addresses, Phone, Email)
  * Continuous Reading View & Paragraphs with Opening & Concluding sentences

* **✏️ Interactive Verification & Review Dashboard**:
  * Color-coded confidence indicators (High / Medium / Needs Review).
  * Inline editable field values with instant validation.
  * Add Custom Fields and Custom Line Items on the fly.
  * One-click export to formatted **JSON** or **CSV**.

* **🛡️ Secure Full-Stack Persistence**:
  * Node.js REST API with native SQLite (`node:sqlite` WAL mode).
  * JWT session tokens and Role-Based Access Control (Admin, Citizen/User, Auditor).
  * Immutable processing audit trail with verification timestamps.

---

## 🏛️ System Architecture

```text
+-----------------------------------------------------------------------------------+
|                                  CLIENT BROWSER                                   |
|                                                                                   |
|  [Document Input & Capture]                                                       |
|   ├── Drag & Drop File Upload (JPEG, PNG, WEBP, PDF)                              |
|   ├── Live Camera Scanner (Modal Viewfinder & Alignment Frame)                    |
|   └── 1-Click Synthetic Samples (Trilingual Bill, Hindi Bill, Gujarati Bill)      |
|         │                                                                         |
|         ▼                                                                         |
|  [Canvas Preprocessing Pipeline] (imagePreprocessing.js)                          |
|   ├── Adaptive Super-Resolution Scaling (Sweet-spot 25-35px character height)     |
|   ├── Photometric Grayscale Conversion (0.299R + 0.587G + 0.114B)                 |
|   ├── Linear Contrast Enhancement & Midpoint Normalization                        |
|   ├── Camera Denoising & 3x3 Laplacian Sharpening Convolution                     |
|   └── Projection Profile Variance Deskew Detection (-10° to +10°)                 |
|         │                                                                         |
|         ▼                                                                         |
|  [Local Tesseract.js v5 WebAssembly Engine] (hin+guj+eng Singleton Worker)        |
|   ├── Zero Manual Language Selection (Automatic Multilingual Mode)                |
|   ├── Dual-Pass PSM 3 (Auto) + PSM 6 (Uniform Block) Segmentation                 |
|   ├── Real-time Worker Progress Dispatch (0% -> 100%)                             |
|   └── Bounding Box & Token Confidence Metric Generation                           |
|         │                                                                         |
|         ▼                                                                         |
|  [Post-Scan Classifier & Cleanser] (classifier.js, deepFieldExtractor.js)         |
|   ├── Indian Digit Normalization (Gujarati [૦-૯] & Devanagari [०-९] -> Arabic)    |
|   ├── Trilingual Entity & Keyword Detection (English, Gujarati, Hindi)            |
|   ├── Stray Border Artifact & Decorative Icon Noise Stripping                     |
|   └── Automatic Document Type Classification (Post-Scan)                          |
|         │                                                                         |
|         ▼                                                                         |
|  [Modular Extraction Parsers] (/parsers/)                                         |
|   ├── Invoice Parser (Totals, Tax, GSTIN, Dates, Line Items)                     |
|   ├── Passport Parser (ICAO Doc 9303 7-3-1 Check Digits, DOB, Expiry, Country)   |
|   ├── Receipt Parser (Merchant, Time, Items, Payment Method, Totals)              |
|   ├── ID Card Parser (License#, Name, DOB, Gender, Authority)                     |
|   ├── Bank Statement Parser (Balances, Debits, Credits, Account#)                 |
|   └── Literature / Prose Parser (Author, Work, Venue, Topic, Sentences)           |
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

```text
UPLOADED  ──►  PROCESSING  ──►  OCR_COMPLETED  ──►  EXTRACTION_COMPLETED
                                                            │
  SAVED   ◄──   VERIFIED   ◄──   NEEDS_REVIEW  ◄────────────┘
    ▲
    └── (FAILED on unreadable input)
```

1. **UPLOADED**: File or camera capture registered with a unique UUID.
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
| **Frontend UI** | React 18.3, Vite 6.1, Vanilla CSS custom design system, Lucide React Icons |
| **Local OCR** | Tesseract.js v5 (WebAssembly + Web Worker Singleton, `hin+guj+eng` language models) |
| **Image Preprocessing** | HTML5 Canvas (Adaptive Scaling, Grayscale, Linear Contrast, Laplacian Filter, Otsu Binarization, Deskew) |
| **Camera Scanner** | HTML5 `navigator.mediaDevices.getUserMedia` video stream & Canvas frame grabber |
| **PDF Support** | `pdfjs-dist` (Client-side page rendering to Canvas) |
| **Backend API** | Node.js (v18/v20/v24), Express 4, Multer, JWT, Bcrypt |
| **Database** | SQLite via native Node `node:sqlite` (`DatabaseSync` in WAL mode) |
| **Testing** | Node native test runner (`node server/tests/run-tests.js`) |

---

## 🚀 Getting Started & How to Run

### Prerequisites
* **Node.js** (v18 or higher; recommended v20 or v24)
* **npm** (included with Node.js)

> 💡 **Windows PowerShell Note**:  
> If PowerShell displays an execution policy restriction (`npm.ps1 cannot be loaded`), simply run commands using **`npm.cmd`** instead of `npm`, e.g. `npm.cmd run dev`.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/fenilpatel-Builds/image_ocr_project.git
cd image_ocr_project
```

---

### Step 2: Install Dependencies
Run the installation command from the repository root:
```bash
npm run install:all
```
*(Alternatively, install each subfolder manually:)*
```bash
npm install
npm install --prefix server
npm install --prefix client
```

---

### Step 3: Run the Application

#### Option A: Single Command (Recommended)
Launch both the backend server and frontend client concurrently:
```bash
npm run dev
```
*(On Windows PowerShell: `npm.cmd run dev`)*

#### Option B: Separate Terminals

**Terminal 1 — Backend Server (Port 4000):**
```bash
npm run server
# or directly:
node server/index.js
```

**Terminal 2 — Frontend Client (Port 5173):**
```bash
npm run client
# or directly:
npm run dev --prefix client
```

---

### Step 4: Open in Your Browser
Navigate to:
```text
http://localhost:5173
```

You will see the DocuScan AI dashboard ready to use:
* **Drag & Drop** any image or PDF (JPG, PNG, WEBP, PDF).
* **Scan with Camera**: Click the camera button to snap a document with your webcam or mobile camera.
* **1-Click Test Samples**:
  * **Try Trilingual Bill (ENG + GUJ + HIN)**: Test a realistic retail invoice containing English, Gujarati, and Hindi all on one bill.
  * **Hindi Bill (हिन्दी)**: Test a Hindi Retail Tax Invoice.
  * **Gujarati Bill (ગુજરાતી)**: Test a Gujarati Retail Tax Invoice.

---

## 🧪 Testing & Verification

### Automated Test Suite
Run the 6-suite verification test covering database initialization, JWT authentication, document lifecycle transitions, RBAC permissions, and ICAO 7-3-1 check digit algorithms:

```bash
npm test
# or:
node server/tests/run-tests.js
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

### Production Client Build Validation
```bash
npm run build --prefix client
```

---

## 👥 Default Demo Accounts (RBAC)

The built-in SQLite database initializes with three sample accounts for role testing:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@example.com` | `admin123` | Full access, system audit trail, analytics, data export |
| **Citizen/User** | `user@example.com` | `user123` | Upload documents, run OCR, review & verify own records |
| **Auditor** | `auditor@example.com` | `auditor123` | Compliance oversight, view all records, inspect audit log |

---

## 👨‍💻 Project Maintainer & Contributors

<div align="center">
  <a href="https://github.com/fenilpatel-Builds">
    <img src="https://github.com/fenilpatel-Builds.png" width="100px;" alt="Fenil Patel" style="border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" /><br />
    <sub><b>Fenil Patel</b></sub>
  </a>
  <br />
  <p><b>Creator & Lead Developer</b></p>
  <a href="https://github.com/fenilpatel-Builds">GitHub Profile</a> • <a href="mailto:fenil8918@gmail.com">Contact Email</a>
</div>

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).