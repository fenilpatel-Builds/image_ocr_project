import React, { useState } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { ocrService } from './ocr/tesseractService';
import { classifyDocument } from './ocr/classifier';
import { parseDocument } from './ocr/parsers';
import { runPreprocessingPipeline } from './ocr/imagePreprocessing';
import { performDeepFieldExtraction } from './ocr/deepFieldExtractor';
import { api } from './api/client';
import { 
  FileText, ShieldCheck, CheckCircle2, Clock, Cpu, 
  Sparkles, ArrowLeft, RefreshCw, Copy, Download, 
  Trash2, Plus, Check, Save, Eye, Table, List, Search,
  FileSpreadsheet, Code, BookOpen, Layers
} from 'lucide-react';

const CATEGORIES = [
  { id: 'general', label: 'General Document / Prose' },
  { id: 'review_article', label: 'Literature / Review / Article' },
  { id: 'invoice', label: 'Bill / Commercial Invoice' },
  { id: 'receipt', label: 'Retail / Cafe Receipt' },
  { id: 'statement', label: 'Bank / Financial Statement' },
  { id: 'order', label: 'Purchase / Sales Order' },
  { id: 'passport', label: 'Passport (ICAO MRZ)' },
  { id: 'id_card', label: 'Identity Card / Driver License' },
  { id: 'certificate', label: 'Certificate / Award' }
];

export function App() {
  // Step 1: Upload, Step 2: Processing, Step 3: Extracting, Step 4: Review
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // OCR & Deep Extraction State (Auto Multilingual: Hindi + Gujarati + English)
  const ocrLanguage = 'hin+guj+eng';
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState({ progress: 0, message: 'Initializing local engine...' });
  const [rawOcrText, setRawOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [documentType, setDocumentType] = useState('general');
  const [classificationInfo, setClassificationInfo] = useState(null);
  
  // Structured fields, prose paragraphs, tables, and text lines
  const [extractedFields, setExtractedFields] = useState([]);
  const [paragraphs, setParagraphs] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [textLines, setTextLines] = useState([]);
  const [extractionStats, setExtractionStats] = useState({ totalFields: 0, linesCount: 0, wordCount: 0, sentenceCount: 0, readingTime: '1 min' });

  // Database record ID & saved state
  const [docRecordId, setDocRecordId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Review UI Controls
  const [activeTab, setActiveTab] = useState('fields'); // 'fields', 'prose', 'table', 'lines', 'raw', 'preview'
  const [fieldSearch, setFieldSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [linesSearch, setLinesSearch] = useState('');
  const [copyToast, setCopyToast] = useState('');

  // Add custom field state
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newFieldCategory, setNewFieldCategory] = useState('Custom');

  // Add custom line item state
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemTotal, setNewItemTotal] = useState('');

  // Helper for quick toast messages
  const showToast = (msg) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(''), 2500);
  };

  // File selection handler
  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setIsSaved(false);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // Run the complete Processing & Local OCR workflow
  const startProcessing = async (fileToProcess) => {
    const file = fileToProcess || selectedFile;
    if (!file) return;

    setCurrentStep(2); // Processing
    setIsProcessing(true);
    setProgressState({ progress: 0.1, message: 'Uploading document to secure local storage...' });

    let recordId = null;
    try {
      // 1. Create document entry on local backend API
      const uploadRes = await api.uploadDocument(file, 'general');
      recordId = uploadRes.document.id;
      setDocRecordId(recordId);

      // 2. Client-side Image Preprocessing on Canvas with Adaptive Super-Resolution & Camera Denoising
      const isCameraImage = file.name && file.name.includes('camera_scan');
      setProgressState({ 
        progress: 0.25, 
        message: isCameraImage ? 'Adaptive camera contrast enhancement & denoising...' : 'Adaptive Canvas super-resolution & normalization...' 
      });
      const preprocessed = await runPreprocessingPipeline(file, {
        grayscale: true,
        contrast: isCameraImage ? 1.15 : 1.08,
        denoise: isCameraImage,
        sharpen: isCameraImage,
        autoDeskew: false
      });

      // 3. Update backend status
      await api.updateStatus(recordId, {
        status: 'PROCESSING',
        note: 'Started client-side Tesseract.js WebAssembly worker'
      });

      // 4. Client-side Tesseract.js OCR execution (with dual-pass block fallback)
      setProgressState({ progress: 0.45, message: 'Initializing local Tesseract.js WebAssembly worker...' });
      const imageForOcr = preprocessed.canvas || preprocessed.processedBlob || file;

      const ocrResult = await ocrService.recognize(imageForOcr, {
        language: ocrLanguage,
        onProgress: (p) => {
          const scaledProgress = 0.45 + (p.progress || 0.1) * 0.4;
          setProgressState({
            progress: Math.min(0.9, scaledProgress),
            message: p.message || 'Recognizing characters and text client-side...'
          });
        }
      });

      setRawOcrText(ocrResult.rawText);
      setOcrConfidence(ocrResult.confidenceAvg);
      setWordCount(ocrResult.wordCount);

      // 5. Save OCR raw result to SQLite database
      await api.saveOCR(recordId, {
        rawText: ocrResult.rawText,
        ocrEngine: ocrResult.engine,
        ocrLanguage: ocrResult.language,
        processingTimeMs: ocrResult.processingTimeMs,
        confidenceAvg: ocrResult.confidenceAvg,
        wordCount: ocrResult.wordCount
      });

      // Move to Step 3: Extracting
      setCurrentStep(3);
      setProgressState({ progress: 0.92, message: 'Post-scan classification & extracting all fields, prose, and entities...' });

      // 6. Dynamic Post-Scan Document Classification (categorizes AFTER scan based on real content)
      const classification = classifyDocument(ocrResult.rawText);
      setClassificationInfo(classification);
      const detectedCat = classification.category !== 'unknown' ? classification.category : 'general';
      setDocumentType(detectedCat);

      // 7. Universal Category & Parser Dispatch
      const parsedFields = parseDocument(detectedCat, ocrResult.rawText, ocrResult.words);

      // 8. Comprehensive Deep Field, Prose, Entity & Table Extraction (captures 100% of text & data)
      const deepResult = performDeepFieldExtraction(ocrResult.rawText, detectedCat, parsedFields);
      setExtractedFields(deepResult.allFields);
      setParagraphs(deepResult.paragraphs);
      setLineItems(deepResult.lineItems);
      setTextLines(deepResult.textLines);
      setExtractionStats(deepResult.stats);

      // If document has substantial prose/review content, default to 'prose' or 'fields'
      if (deepResult.paragraphs.length > 0 && deepResult.lineItems.length === 0) {
        setActiveTab('fields');
      }

      // Save initial extracted fields to SQLite
      await api.saveFields(recordId, {
        fields: deepResult.allFields,
        documentType: detectedCat,
        isUserEdited: false
      });

      setProgressState({ progress: 1.0, message: 'Deep extraction completed successfully!' });

      // Small delay then transition to Step 4: Review
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep(4);
      }, 500);

    } catch (err) {
      console.error('Processing workflow error:', err);
      setIsProcessing(false);
      alert('OCR processing error: ' + err.message + '. Please ensure image is clear and try again.');
      setCurrentStep(1);
    }
  };

  // Field editing
  const handleFieldChange = (index, newVal) => {
    const updated = [...extractedFields];
    updated[index] = { ...updated[index], value: newVal, user_edited: 1 };
    setExtractedFields(updated);
  };

  const handleRemoveField = (index) => {
    setExtractedFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    setExtractedFields(prev => [
      ...prev,
      {
        name: newFieldName.trim(),
        value: newFieldValue.trim(),
        type: 'string',
        category: newFieldCategory || 'Custom',
        confidence: 1.0,
        rating: 'HIGH',
        verified: 1,
        user_edited: 1
      }
    ]);
    setNewFieldName('');
    setNewFieldValue('');
    setShowAddField(false);
    showToast('Custom field added!');
  };

  const handleAddLineAsField = (lineText) => {
    const parts = lineText.split(/[:=–—]/);
    let name = 'Extracted Field';
    let value = lineText;
    if (parts.length >= 2) {
      name = parts[0].trim();
      value = parts.slice(1).join(':').trim();
    }
    setExtractedFields(prev => [
      ...prev,
      {
        name,
        value,
        type: 'string',
        category: 'Custom',
        confidence: 0.95,
        rating: 'HIGH',
        verified: 1,
        user_edited: 1
      }
    ]);
    setActiveTab('fields');
    showToast(`Added "${name}" to fields!`);
  };

  // Line item table editing
  const handleLineItemChange = (index, key, val) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [key]: val };
    // Auto calculate total if qty and unitPrice are numbers
    if (key === 'quantity' || key === 'unitPrice') {
      const q = parseFloat(key === 'quantity' ? val : updated[index].quantity) || 0;
      const p = parseFloat(String(key === 'unitPrice' ? val : updated[index].unitPrice).replace(/[^0-9.]/g, '')) || 0;
      if (q > 0 && p > 0) {
        updated[index].total = (q * p).toFixed(2);
      }
    }
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLineItem = () => {
    if (!newItemDesc.trim()) return;
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: newItemDesc.trim(),
        quantity: newItemQty.trim() || '1',
        unitPrice: newItemPrice.trim() || '0.00',
        total: newItemTotal.trim() || newItemPrice.trim() || '0.00'
      }
    ]);
    setNewItemDesc('');
    setNewItemQty('1');
    setNewItemPrice('');
    setNewItemTotal('');
    setShowAddLineItem(false);
    showToast('Line item row added!');
  };

  // Re-evaluates category
  const handleCategoryChange = (newCat) => {
    setDocumentType(newCat);
    if (rawOcrText) {
      const reParsed = parseDocument(newCat, rawOcrText);
      const deepResult = performDeepFieldExtraction(rawOcrText, newCat, reParsed);
      setExtractedFields(deepResult.allFields);
      setParagraphs(deepResult.paragraphs);
      if (deepResult.lineItems.length > 0) {
        setLineItems(deepResult.lineItems);
      }
    }
  };

  // Commit verified fields to SQLite database
  const handleVerifyAndSave = async () => {
    if (!docRecordId) {
      setIsSaved(true);
      showToast('Document saved!');
      return;
    }

    setIsSaving(true);
    try {
      await api.verifyDocument(docRecordId, {
        fields: extractedFields,
        lineItems: lineItems,
        documentType: documentType
      });
      setIsSaved(true);
      showToast('Verified & saved to SQLite database!');
    } catch (err) {
      alert('Save error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setPreviewUrl(null);
    setRawOcrText('');
    setExtractedFields([]);
    setParagraphs([]);
    setLineItems([]);
    setTextLines([]);
    setDocRecordId(null);
    setIsSaved(false);
  };

  // Export functions
  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawOcrText);
    showToast('Raw OCR text copied to clipboard!');
  };

  const handleDownloadRaw = () => {
    const blob = new Blob([rawOcrText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocr_raw_text_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyFullProse = () => {
    const textToCopy = paragraphs.join('\n\n') || rawOcrText;
    navigator.clipboard.writeText(textToCopy);
    showToast('Full prose text copied to clipboard!');
  };

  const handleDownloadFullProse = () => {
    const textToSave = paragraphs.join('\n\n') || rawOcrText;
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_text_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    const payload = {
      documentName: selectedFile?.name,
      documentType,
      confidenceAvg: ocrConfidence,
      extractedFields,
      paragraphs,
      lineItems,
      rawText: rawOcrText,
      extractedAt: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    showToast('Structured JSON copied to clipboard!');
  };

  const handleDownloadJSON = () => {
    const payload = {
      documentName: selectedFile?.name,
      documentType,
      confidenceAvg: ocrConfidence,
      extractedFields,
      paragraphs,
      lineItems,
      stats: extractionStats,
      rawText: rawOcrText,
      extractedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_data_${documentType}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    let csv = 'Field Name,Field Value,Category,Confidence,Status\n';
    extractedFields.forEach(f => {
      const cleanVal = String(f.value).replace(/"/g, '""');
      csv += `"${f.name}","${cleanVal}","${f.category || 'General'}","${Math.round((f.confidence || 0.85)*100)}%","${f.verified ? 'Verified' : 'Extracted'}"\n`;
    });

    if (lineItems.length > 0) {
      csv += '\nLine Items\nItem Description,Quantity,Unit Price,Total\n';
      lineItems.forEach(li => {
        csv += `"${li.description}","${li.quantity}","${li.unitPrice}","${li.total}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_fields_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtering for fields
  const categoriesPresent = ['ALL', ...new Set(extractedFields.map(f => f.category || 'General'))];
  
  const filteredFields = extractedFields.filter(f => {
    const matchCat = categoryFilter === 'ALL' || (f.category || 'General') === categoryFilter;
    const matchSearch = !fieldSearch || 
      f.name.toLowerCase().includes(fieldSearch.toLowerCase()) || 
      String(f.value).toLowerCase().includes(fieldSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filtering for lines
  const filteredLines = textLines.filter(l => 
    !linesSearch || l.text.toLowerCase().includes(linesSearch.toLowerCase())
  );

  return (
    <div className="doc-card-container">
      
      {/* Toast Notification */}
      {copyToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} color="#10b981" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: Brand Identity, Dynamic Stepper, & Privacy Guarantee */}
      <aside className="doc-sidebar">
        <div>
          {/* Brand Identity */}
          <div className="doc-brand">
            <div className="doc-brand-icon">
              <FileText size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="doc-brand-title">DocuScan AI</div>
              <div className="doc-brand-subtitle">OCR & Deep Extraction</div>
            </div>
          </div>

          {/* Dynamic Stepper Navigation */}
          <nav className="doc-stepper" aria-label="Workflow progress">
            {/* Step 1: Upload */}
            <div className={`doc-step-item ${currentStep === 1 ? 'is-active' : currentStep > 1 ? 'is-done' : ''}`}>
              <div className="doc-step-circle">
                {currentStep > 1 ? <Check size={14} strokeWidth={3} /> : '1'}
              </div>
              <span>Upload</span>
            </div>

            {/* Step 2: Processing */}
            <div className={`doc-step-item ${currentStep === 2 ? 'is-active' : currentStep > 2 ? 'is-done' : ''}`}>
              <div className="doc-step-circle">
                {currentStep > 2 ? <Check size={14} strokeWidth={3} /> : '2'}
              </div>
              <span>Processing</span>
            </div>

            {/* Step 3: Extracting */}
            <div className={`doc-step-item ${currentStep === 3 ? 'is-active' : currentStep > 3 ? 'is-done' : ''}`}>
              <div className="doc-step-circle">
                {currentStep > 3 ? <Check size={14} strokeWidth={3} /> : '3'}
              </div>
              <span>Extracting</span>
            </div>

            {/* Step 4: Review */}
            <div className={`doc-step-item ${currentStep === 4 ? (isSaved ? 'is-done' : 'is-active') : ''}`}>
              <div className="doc-step-circle">
                {isSaved ? <Check size={14} strokeWidth={3} /> : '4'}
              </div>
              <span>Review</span>
            </div>
          </nav>
        </div>

        {/* Bottom Security / Privacy Badge */}
        <div className="doc-security-box">
          <div className="doc-security-icon">
            <ShieldCheck size={13} strokeWidth={2.5} />
          </div>
          <div>
            <div className="doc-security-title">100% Local Execution</div>
            <div className="doc-security-desc">
              Tesseract.js WebAssembly processes image entirely in your browser. Zero cloud APIs.
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT WORKSPACE */}
      <main className="doc-workspace">
        
        {/* ===================================================================
            STEP 1: Document Upload & File Selection
           =================================================================== */}
        {currentStep === 1 && (
          <DocumentUpload
            onFileSelected={handleFileSelected}
            onProcess={startProcessing}
            isProcessing={isProcessing}
          />
        )}

        {/* ===================================================================
            STEP 2 & 3: Processing & Local Tesseract.js OCR Execution
           =================================================================== */}
        {(currentStep === 2 || currentStep === 3) && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <span className="doc-section-label">DOCUMENT INTELLIGENCE ENGINE</span>
            <h1 className="doc-main-heading">
              {currentStep === 2 ? 'Processing Document with Local OCR' : 'Extracting All Fields, Text & Entities'}
            </h1>
            <p className="doc-sub-text">
              Running client-side WebAssembly character recognition and deep field parsing. No data leaves your machine.
            </p>

            <div className="doc-processing-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={20} className="animate-spin" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      {progressState.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      File: {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>
                  {Math.round(progressState.progress * 100)}%
                </div>
              </div>

              {/* Real-time Progress Bar */}
              <div className="doc-progress-track">
                <div
                  className="doc-progress-fill"
                  style={{ width: `${Math.round(progressState.progress * 100)}%` }}
                />
              </div>

              {/* Processing Pipeline Checklist */}
              <div className="doc-processing-steps">
                <div className="doc-proc-step-row is-done">
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>Document uploaded and validated</span>
                </div>

                <div className={`doc-proc-step-row ${progressState.progress >= 0.25 ? 'is-done' : ''}`}>
                  {progressState.progress >= 0.25 ? <CheckCircle2 size={16} color="#16a34a" /> : <Clock size={16} color="#94a3b8" />}
                  <span>Adaptive super-resolution & Canvas preprocessing</span>
                </div>

                <div className={`doc-proc-step-row ${progressState.progress >= 0.45 ? 'is-done' : ''}`}>
                  {progressState.progress >= 0.45 ? <CheckCircle2 size={16} color="#16a34a" /> : <Clock size={16} color="#94a3b8" />}
                  <span>Local Tesseract.js Web Worker initialized (WASM)</span>
                </div>

                <div className={`doc-proc-step-row ${progressState.progress >= 0.85 ? 'is-done' : ''}`}>
                  {progressState.progress >= 0.85 ? <CheckCircle2 size={16} color="#16a34a" /> : <Clock size={16} color="#94a3b8" />}
                  <span>Text recognition & character confidence evaluation</span>
                </div>

                <div className={`doc-proc-step-row ${progressState.progress >= 0.95 ? 'is-done' : ''}`}>
                  {progressState.progress >= 0.95 ? <CheckCircle2 size={16} color="#16a34a" /> : <Clock size={16} color="#94a3b8" />}
                  <span>Post-scan classification & full entity/prose extraction</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 4: Review, Verification, Deep Extraction & SQLite Save
           =================================================================== */}
        {currentStep === 4 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header with Classification Badge */}
            <div className="doc-review-header">
              <div>
                <span className="doc-section-label">VERIFICATION & REVIEW</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <h1 className="doc-main-heading" style={{ margin: 0 }}>
                    Extracted Information
                  </h1>
                  <span className="doc-category-badge">
                    <Sparkles size={12} />
                    <span>{classificationInfo?.label || documentType}</span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>
                    {extractedFields.length} Fields • {paragraphs.length} Paragraphs • {textLines.length} Lines
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#4338ca', background: '#e0e7ff', border: '1px solid #c7d2fe', padding: '4px 12px', borderRadius: '8px' }}>
                    🌐 Auto Multilingual (English • ગુજરાતી • हिन्दी)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={documentType}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  title="Override Document Category"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleStartOver}
                  className="btn-change"
                  title="Upload Another Document"
                >
                  <ArrowLeft size={13} />
                  <span>New Document</span>
                </button>
              </div>
            </div>

            {/* Success Banner if Saved */}
            {isSaved && (
              <div className="doc-success-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#065f46' }}>
                      Document Successfully Verified & Saved in Database!
                    </div>
                    <div style={{ fontSize: '12px', color: '#047857' }}>
                      Structured fields committed to local SQLite database with full traceability audit log.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartOver}
                  className="btn-browse"
                  style={{ fontSize: '13px', padding: '10px 18px', background: '#16a34a' }}
                >
                  <span>Upload Another Document</span>
                </button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="doc-tabs-bar">
              <button
                type="button"
                className={`doc-tab-btn ${activeTab === 'fields' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('fields')}
              >
                <Sparkles size={14} />
                <span>Structured Information ({extractedFields.length})</span>
              </button>

              <button
                type="button"
                className={`doc-tab-btn ${activeTab === 'prose' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('prose')}
              >
                <BookOpen size={14} />
                <span>Reading View & Text ({paragraphs.length || 1})</span>
              </button>

              <button
                type="button"
                className={`doc-tab-btn ${activeTab === 'table' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('table')}
              >
                <Table size={14} />
                <span>Line Items & Tables ({lineItems.length})</span>
              </button>

              <button
                type="button"
                className={`doc-tab-btn ${activeTab === 'lines' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('lines')}
              >
                <List size={14} />
                <span>All Extracted Lines ({textLines.length})</span>
              </button>

              <button
                type="button"
                className={`doc-tab-btn ${activeTab === 'raw' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                <FileText size={14} />
                <span>Raw OCR Text</span>
              </button>

              <button
                type="button"
                className={`doc-tab-btn ${activeTab === 'preview' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye size={14} />
                <span>Document Image</span>
              </button>
            </div>

            {/* ===============================================================
                TAB 1: Structured Information with Dynamic Category Chips & Search
               =============================================================== */}
            {activeTab === 'fields' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Search Bar & Export Tools */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div className="doc-search-bar" style={{ maxWidth: '320px' }}>
                    <Search size={14} color="#94a3b8" />
                    <input
                      type="text"
                      className="doc-search-input"
                      placeholder="Search fields, paragraphs & values..."
                      value={fieldSearch}
                      onChange={(e) => setFieldSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleCopyJSON}
                      className="btn-change"
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                      title="Copy structured JSON to clipboard"
                    >
                      <Code size={13} />
                      <span>Copy JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadJSON}
                      className="btn-change"
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                      title="Download JSON export"
                    >
                      <Download size={13} />
                      <span>JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      className="btn-change"
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                      title="Download CSV spreadsheet"
                    >
                      <FileSpreadsheet size={13} />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="doc-category-filters">
                  {categoriesPresent.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`doc-filter-chip ${categoryFilter === cat ? 'is-active' : ''}`}
                      onClick={() => setCategoryFilter(cat)}
                    >
                      {cat} {cat === 'ALL' ? `(${extractedFields.length})` : `(${extractedFields.filter(f => (f.category || 'General') === cat).length})`}
                    </button>
                  ))}
                </div>

                {/* Fields list */}
                <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredFields.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '12px' }}>
                      No fields matching current search/filter.
                    </div>
                  ) : (
                    filteredFields.map((field, idx) => {
                      const originalIndex = extractedFields.findIndex(f => f.name === field.name && f.value === field.value);
                      const confPct = Math.round((field.confidence || 0.85) * 100);
                      const isMultiLine = String(field.value).length > 80;

                      return (
                        <div key={idx} className="doc-field-row" style={{ alignItems: isMultiLine ? 'flex-start' : 'center' }}>
                          <div className="doc-field-label">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{field.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span style={{ fontSize: '10px', color: '#475569', background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px' }}>
                                {field.category || 'General'}
                              </span>
                              <span className={`doc-conf-pill ${confPct >= 85 ? 'conf-high' : confPct >= 65 ? 'conf-med' : 'conf-low'}`}>
                                {confPct >= 85 ? `✓ ${confPct}%` : confPct >= 65 ? `! ${confPct}%` : `⚠ ${confPct}%`}
                              </span>
                            </div>
                          </div>

                          {isMultiLine ? (
                            <textarea
                              className="doc-field-input"
                              rows={3}
                              value={field.value}
                              onChange={(e) => handleFieldChange(originalIndex >= 0 ? originalIndex : idx, e.target.value)}
                              placeholder="Enter value..."
                              style={{ resize: 'vertical' }}
                            />
                          ) : (
                            <input
                              type="text"
                              className="doc-field-input"
                              value={field.value}
                              onChange={(e) => handleFieldChange(originalIndex >= 0 ? originalIndex : idx, e.target.value)}
                              placeholder="Enter value..."
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveField(originalIndex >= 0 ? originalIndex : idx)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
                            title="Remove field"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Custom Field */}
                {showAddField ? (
                  <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Field Name (e.g. Account Number, Tracking Code, Topic)"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      style={{ flex: 1, minWidth: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      placeholder="Field Value"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      style={{ flex: 1, minWidth: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <select
                      value={newFieldCategory}
                      onChange={(e) => setNewFieldCategory(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff' }}
                    >
                      <option value="Custom">Custom</option>
                      <option value="Content & Paragraphs">Content & Paragraphs</option>
                      <option value="Entities & Topics">Entities & Topics</option>
                      <option value="Financial">Financial</option>
                      <option value="Dates">Dates</option>
                      <option value="Contact">Contact</option>
                      <option value="Identifier">Identifier</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="btn-browse"
                      style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                      Add Field
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddField(false)}
                      className="btn-remove"
                      style={{ fontSize: '12px', padding: '8px 12px' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddField(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      alignSelf: 'flex-start',
                      marginTop: '4px'
                    }}
                  >
                    <Plus size={15} />
                    <span>Add Custom Field</span>
                  </button>
                )}

                {/* Save CTA */}
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleVerifyAndSave}
                    disabled={isSaving || isSaved}
                    className="btn-browse"
                    style={{
                      background: isSaved ? '#16a34a' : '#2563eb',
                      fontSize: '14px',
                      padding: '12px 28px',
                      gap: '8px'
                    }}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <Check size={16} strokeWidth={2.5} />
                        <span>Verified & Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Verify & Save to Database</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 2: Full Reading View & Prose Paragraphs
               =============================================================== */}
            {activeTab === 'prose' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div className="doc-reading-meta-bar">
                    <span><strong>Words:</strong> {extractionStats.wordCount}</span>
                    <span>•</span>
                    <span><strong>Sentences:</strong> {extractionStats.sentenceCount}</span>
                    <span>•</span>
                    <span><strong>Est. Read Time:</strong> {extractionStats.readingTime}</span>
                    <span>•</span>
                    <span><strong>Avg Confidence:</strong> {ocrConfidence}%</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleCopyFullProse}
                      className="btn-change"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Copy size={13} />
                      <span>Copy All Prose</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadFullProse}
                      className="btn-change"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Download size={13} />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>

                <div className="doc-reading-card">
                  {extractedFields.find(f => f.name === 'Document Title / Header') && (
                    <div className="doc-reading-title">
                      {extractedFields.find(f => f.name === 'Document Title / Header')?.value}
                    </div>
                  )}

                  {paragraphs.length === 0 ? (
                    <div className="doc-reading-paragraph">
                      {rawOcrText || 'No text detected in document.'}
                    </div>
                  ) : (
                    paragraphs.map((p, pIdx) => (
                      <div key={pIdx} className="doc-reading-paragraph">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Paragraph {pIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(p);
                              showToast(`Copied paragraph ${pIdx + 1}!`);
                            }}
                            className="doc-line-action-btn"
                            title="Copy paragraph"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p style={{ margin: 0, color: '#0f172a' }}>{p}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 3: Line Items & Tables (Invoices, Orders, Receipts, Statements)
               =============================================================== */}
            {activeTab === 'table' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Itemized table records detected from bills, orders, or statements:
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddLineItem(true)}
                      className="btn-change"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Plus size={13} />
                      <span>Add Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      className="btn-change"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Download size={13} />
                      <span>Export Table CSV</span>
                    </button>
                  </div>
                </div>

                {/* Add Row Inline Form */}
                {showAddLineItem && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Item Description"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      style={{ flex: 2, minWidth: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      style={{ width: '60px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      placeholder="Price"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      placeholder="Total"
                      value={newItemTotal}
                      onChange={(e) => setNewItemTotal(e.target.value)}
                      style={{ width: '90px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="btn-browse"
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddLineItem(false)}
                      className="btn-remove"
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Table View */}
                {lineItems.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <Table size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#475569' }}>No itemized table rows automatically detected</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "Add Row" above to enter item lines manually or check "All Extracted Lines".</div>
                  </div>
                ) : (
                  <div className="doc-table-container">
                    <table className="doc-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>Description</th>
                          <th style={{ width: '80px' }}>Qty</th>
                          <th style={{ width: '110px' }}>Unit Price</th>
                          <th style={{ width: '110px' }}>Total</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td style={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                            <td>
                              <input
                                type="text"
                                className="doc-table-input"
                                value={item.description}
                                onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="doc-table-input"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="doc-table-input"
                                value={item.unitPrice}
                                onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="doc-table-input"
                                style={{ fontWeight: 600 }}
                                value={item.total}
                                onChange={(e) => handleLineItemChange(idx, 'total', e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                title="Remove row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                TAB 4: All Detected Lines (Zero Information Loss)
               =============================================================== */}
            {activeTab === 'lines' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Every single text line recognized from the image with one-click field conversion:
                  </span>
                  <div className="doc-search-bar" style={{ maxWidth: '280px' }}>
                    <Search size={14} color="#94a3b8" />
                    <input
                      type="text"
                      className="doc-search-input"
                      placeholder="Filter lines..."
                      value={linesSearch}
                      onChange={(e) => setLinesSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="doc-lines-list">
                  {filteredLines.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      No lines match current search.
                    </div>
                  ) : (
                    filteredLines.map(item => (
                      <div key={item.lineNumber} className="doc-line-item">
                        <span className="doc-line-num">{String(item.lineNumber).padStart(2, '0')}</span>
                        <span className="doc-line-content">{item.text}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="doc-line-action-btn"
                            onClick={() => handleAddLineAsField(item.text)}
                            title="Add this line to structured fields"
                          >
                            <Plus size={12} />
                            <span>Add Field</span>
                          </button>
                          <button
                            type="button"
                            className="doc-line-action-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(item.text);
                              showToast(`Copied line ${item.lineNumber}!`);
                            }}
                            title="Copy line text"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 5: Verbatim Raw OCR Text
               =============================================================== */}
            {activeTab === 'raw' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', flexWrap: 'wrap', gap: '8px' }}>
                  <span>Engine: <strong>Tesseract.js v5 (WASM)</strong> • Words: <strong>{wordCount}</strong> • Avg Confidence: <strong>{ocrConfidence}%</strong></span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleCopyRaw}
                      className="btn-change"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Copy size={13} />
                      <span>Copy Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadRaw}
                      className="btn-change"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Download size={13} />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>

                <pre className="doc-raw-text-pre">
                  {rawOcrText || 'No text detected.'}
                </pre>
              </div>
            )}

            {/* ===============================================================
                TAB 6: Original Document Preview
               =============================================================== */}
            {activeTab === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', minHeight: '340px', justifyContent: 'center' }}>
                {previewUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                    <img
                      src={previewUrl}
                      alt="Uploaded Document"
                      style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    />
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>No image preview available</span>
                )}
              </div>
            )}

          </div>
        )}

        {/* Corner Decorative Illustration matching visual reference */}
        {currentStep === 1 && (
          <div className="doc-corner-decor" aria-hidden="true">
            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
              <svg
                style={{ position: 'absolute', top: '-10px', right: '-4px' }}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="4" x2="12" y2="8" />
                <line x1="18" y1="6" x2="15" y2="9" />
                <line x1="20" y1="12" x2="16" y2="12" />
              </svg>

              <div
                style={{
                  width: '54px',
                  height: '66px',
                  background: '#ffffff',
                  border: '1.5px solid #dbeafe',
                  borderRadius: '8px',
                  boxShadow: '0 8px 16px rgba(191, 219, 254, 0.4)',
                  transform: 'rotate(10deg)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}
              >
                <div style={{ height: '3px', width: '22px', background: '#93c5fd', borderRadius: '2px' }} />
                <div style={{ height: '3px', width: '32px', background: '#bfdbfe', borderRadius: '2px' }} />
                <div style={{ height: '3px', width: '26px', background: '#bfdbfe', borderRadius: '2px' }} />
                <div style={{ height: '3px', width: '18px', background: '#bfdbfe', borderRadius: '2px' }} />
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '4px',
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)',
                  transform: 'rotate(-4deg)'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 8V4h4" />
                  <path d="M20 8V4h-4" />
                  <path d="M4 16v4h4" />
                  <path d="M20 16v4h-4" />
                  <rect x="8" y="8" width="8" height="8" rx="1" />
                </svg>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
