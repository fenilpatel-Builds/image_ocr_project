import React, { useState, useEffect } from 'react';
import { runPreprocessingPipeline } from '../ocr/imagePreprocessing';
import { Sliders, RotateCw, RotateCcw, Zap, Sparkles, Eye, Contrast, RefreshCw } from 'lucide-react';

export function ImagePreprocessor({
  originalSource,
  onPreprocessed,
  isProcessing
}) {
  const [options, setOptions] = useState({
    grayscale: true,
    contrast: 1.3,
    brightness: 8,
    denoise: false,
    sharpen: true,
    binarize: false,
    autoDeskew: false,
    manualRotation: 0
  });

  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [detectedAngle, setDetectedAngle] = useState(0);
  const [viewMode, setViewMode] = useState('enhanced'); // 'enhanced' or 'original'
  const [computing, setComputing] = useState(false);

  // Debounced auto-run preprocessing when options change
  useEffect(() => {
    let cancel = false;
    if (!originalSource) return;

    const execute = async () => {
      setComputing(true);
      try {
        const result = await runPreprocessingPipeline(originalSource, options);
        if (!cancel) {
          setPreviewDataUrl(result.processedDataUrl);
          setProcessingTime(result.processingTimeMs);
          setDetectedAngle(result.detectedAngle);
          onPreprocessed(result);
        }
      } catch (err) {
        console.error('Preprocessing pipeline error:', err);
      } finally {
        if (!cancel) setComputing(false);
      }
    };

    const timer = setTimeout(execute, 100);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [originalSource, options]);

  const handleRotate = (angleDelta) => {
    setOptions(prev => ({
      ...prev,
      manualRotation: (prev.manualRotation + angleDelta) % 360
    }));
  };

  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-4">
      {/* Header & Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">Client-Side Canvas Preprocessing</h4>
          {processingTime !== null && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {processingTime}ms locally
            </span>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
              viewMode === 'original'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setViewMode('enhanced')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
              viewMode === 'enhanced'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Enhanced for OCR
          </button>
        </div>
      </div>

      {/* Interactive Toolbar for OCR optimization */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {/* Grayscale */}
        <button
          onClick={() => toggleOption('grayscale')}
          className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition ${
            options.grayscale
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5'
          }`}
        >
          <span>Grayscale</span>
          <span className="text-[10px] font-bold">{options.grayscale ? 'ON' : 'OFF'}</span>
        </button>

        {/* Sharpening */}
        <button
          onClick={() => toggleOption('sharpen')}
          className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition ${
            options.sharpen
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5'
          }`}
        >
          <span>Sharpen</span>
          <span className="text-[10px] font-bold">{options.sharpen ? 'ON' : 'OFF'}</span>
        </button>

        {/* Denoise */}
        <button
          onClick={() => toggleOption('denoise')}
          className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition ${
            options.denoise
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5'
          }`}
        >
          <span>Denoise</span>
          <span className="text-[10px] font-bold">{options.denoise ? 'ON' : 'OFF'}</span>
        </button>

        {/* Otsu Binarization */}
        <button
          onClick={() => toggleOption('binarize')}
          className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition ${
            options.binarize
              ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5'
          }`}
        >
          <span>Binarize (Otsu)</span>
          <span className="text-[10px] font-bold">{options.binarize ? 'ON' : 'OFF'}</span>
        </button>

        {/* Auto-Deskew */}
        <button
          onClick={() => toggleOption('autoDeskew')}
          className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition ${
            options.autoDeskew
              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5'
          }`}
        >
          <span>Auto-Deskew</span>
          <span className="text-[10px] font-bold">
            {options.autoDeskew ? `${detectedAngle.toFixed(1)}°` : 'OFF'}
          </span>
        </button>

        {/* Manual Rotate */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleRotate(-90)}
            className="flex-1 py-2 px-2 bg-slate-900/60 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium border border-white/10 flex items-center justify-center gap-1"
            title="Rotate Left 90°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>-90°</span>
          </button>
          <button
            onClick={() => handleRotate(90)}
            className="flex-1 py-2 px-2 bg-slate-900/60 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium border border-white/10 flex items-center justify-center gap-1"
            title="Rotate Right 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>+90°</span>
          </button>
        </div>
      </div>

      {/* Live Canvas / Image Preview Container */}
      <div className="relative w-full max-h-[380px] bg-slate-950/80 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center p-2">
        {computing && (
          <div className="absolute inset-0 bg-slate-950/60 z-20 flex items-center justify-center gap-2 text-cyan-300 text-xs font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Applying canvas filter...
          </div>
        )}

        <img
          src={viewMode === 'enhanced' && previewDataUrl ? previewDataUrl : (originalSource instanceof File ? URL.createObjectURL(originalSource) : originalSource)}
          alt="Document Preview"
          className="max-h-[360px] w-auto max-w-full object-contain rounded-lg shadow-lg"
        />

        <div className="absolute bottom-3 left-3 z-10 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-slate-300 border border-white/10">
          Showing: <span className="font-semibold text-white">{viewMode === 'enhanced' ? 'Enhanced Preprocessed Canvas' : 'Original Raw Source'}</span>
        </div>
      </div>
    </div>
  );
}
