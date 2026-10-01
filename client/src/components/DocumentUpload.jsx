import React, { useState, useRef } from 'react';
import { FolderOpen, CheckCircle2, AlertCircle, RefreshCw, X, Image as ImageIcon, FileText, ArrowRight, Sparkles } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
];

export function DocumentUpload({ onFileSelected, onProcess, isProcessing }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Validate file against format and size constraints
  const validateFile = (file) => {
    setValidationError(null);
    if (!file) return false;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type);
    const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

    if (!isMimeValid && !isExtValid) {
      setValidationError('Unsupported file type. Please upload JPG, JPEG, PNG, WEBP, or PDF.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError('File size exceeds the 10MB limit. Please choose a smaller file.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (onFileSelected) onFileSelected(file);
      } else {
        setSelectedFile(null);
        if (onFileSelected) onFileSelected(null);
      }
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (onFileSelected) onFileSelected(file);
      } else {
        setSelectedFile(null);
        if (onFileSelected) onFileSelected(null);
      }
    }
  };

  const handleClearFile = (e) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelected) onFileSelected(null);
  };

  const openFilePicker = (e) => {
    if (e) e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header section matching reference mockup */}
      <span className="doc-section-label">DOCUMENT UPLOAD</span>
      <h1 className="doc-main-heading">Upload Your Document</h1>
      <p className="doc-sub-text">
        Drag and drop your file here, or choose from your device.
      </p>

      {/* Real Hidden File Input (Strictly Invisible) */}
      <input
        ref={fileInputRef}
        type="file"
        id="document-upload-input"
        aria-label="Upload Document"
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Inline Validation Alert */}
      {validationError && (
        <div className="doc-error-alert" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: '2px' }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Large Dashed Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!selectedFile ? openFilePicker : undefined}
        className={`doc-dropzone ${isDragging ? 'is-dragging' : ''}`}
        style={{ cursor: selectedFile ? 'default' : 'pointer' }}
      >
        {!selectedFile ? (
          <>
            {/* Vector Illustration matching reference mockup */}
            <div className="doc-illustration-wrap" onClick={(e) => e.stopPropagation()}>
              <div className="doc-illustration-blob" />
              
              {/* Floating ambient sparkle symbols */}
              <span className="sparkle-green-1">+</span>
              <span className="sparkle-green-2">+</span>
              <span className="sparkle-purple">♦</span>
              <span className="sparkle-cyan">•</span>

              {/* Vector Document Graphic */}
              <div className="doc-illustration-sheet">
                <svg width="68" height="80" viewBox="0 0 68 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="64" height="76" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                  <rect x="14" y="20" width="34" height="4" rx="2" fill="#93c5fd" />
                  <rect x="14" y="30" width="40" height="4" rx="2" fill="#bfdbfe" />
                  <rect x="14" y="40" width="28" height="4" rx="2" fill="#bfdbfe" />
                </svg>
              </div>

              {/* Royal Blue Upload Arrow Badge */}
              <div className="doc-illustration-arrow-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </div>
            </div>

            {/* Prompt titles */}
            <div className="doc-drop-title">
              {isDragging ? 'Drop your document here' : 'Drag & drop your document here'}
            </div>
            <div className="doc-drop-subtitle">
              or choose from your device
            </div>

            {/* Single Primary Browse Button (Camera removed as requested) */}
            <div className="doc-btn-group" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn-browse"
                onClick={openFilePicker}
              >
                <FolderOpen size={16} />
                <span>Browse Files</span>
              </button>
            </div>

            {/* OR Divider Line */}
            <div className="doc-or-divider">
              <div className="doc-or-line" />
              <span className="doc-or-text">SUPPORTED FORMATS</span>
              <div className="doc-or-line" />
            </div>

            {/* Supported Format Pills matching reference image */}
            <div className="doc-format-pills" onClick={(e) => e.stopPropagation()}>
              <div className="doc-format-pill pill-jpg">
                <ImageIcon size={13} />
                <span>JPG</span>
              </div>

              <div className="doc-format-pill pill-png">
                <ImageIcon size={13} />
                <span>PNG</span>
              </div>

              <div className="doc-format-pill pill-jpeg">
                <ImageIcon size={13} />
                <span>JPEG</span>
              </div>

              <div className="doc-format-pill pill-webp">
                <ImageIcon size={13} />
                <span>WEBP</span>
              </div>

              <div className="doc-format-pill pill-pdf">
                <FileText size={13} />
                <span>PDF</span>
              </div>
            </div>

            {/* Helper note */}
            <div className="doc-helper-note">
              Supported formats: JPG, JPEG, PNG, WEBP, PDF &nbsp;|&nbsp; Max file size: 10MB
            </div>
          </>
        ) : (
          /* State 5: Valid File Selected confirmation with Process CTA */
          <div className="doc-selected-box" onClick={(e) => e.stopPropagation()}>
            <div className="doc-selected-icon-badge">
              <CheckCircle2 size={26} strokeWidth={2.5} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div className="doc-selected-name" title={selectedFile.name}>
                {selectedFile.name}
              </div>
              <div className="doc-selected-meta">
                <span>{formatFileSize(selectedFile.size)}</span>
                <span>•</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#15803d' }}>
                  {selectedFile.name.split('.').pop()}
                </span>
                <span>•</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Ready to Process</span>
              </div>
            </div>

            {/* Prominent Action Button: Start Processing */}
            <div style={{ marginTop: '10px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn-process-action"
                onClick={() => onProcess && onProcess(selectedFile)}
                disabled={isProcessing}
              >
                <Sparkles size={16} />
                <span>Process Document & Extract Data</span>
                <ArrowRight size={16} />
              </button>

              <div className="doc-selected-actions">
                <button
                  type="button"
                  className="btn-change"
                  onClick={openFilePicker}
                  disabled={isProcessing}
                >
                  <RefreshCw size={13} />
                  <span>Change File</span>
                </button>

                <button
                  type="button"
                  className="btn-remove"
                  onClick={handleClearFile}
                  disabled={isProcessing}
                >
                  <X size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
