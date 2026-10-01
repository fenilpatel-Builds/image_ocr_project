import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Search } from 'lucide-react';

export function RawTextViewer({ rawText = '', confidenceAvg = 0, wordCount = 0 }) {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const lines = rawText.split('\n');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocr_raw_text_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel flex flex-col overflow-hidden border-white/10">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white text-base">Verbatim Raw OCR Text</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Unmodified OCR Output
          </span>
        </div>

        {/* Stats Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/5 text-slate-300">
            Lines: <span className="font-mono text-white font-semibold">{lines.length}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/5 text-slate-300">
            Words: <span className="font-mono text-white font-semibold">{wordCount || rawText.split(/\s+/).filter(Boolean).length}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            Avg Confidence: <span className="font-mono font-bold">{confidenceAvg}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Copy Raw Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={downloadTextFile}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Download .txt"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Optional Search / Quick filter within text */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-white/5 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter keywords in raw OCR stream..."
          className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full"
        />
      </div>

      {/* Code / Text Container with Line Numbers */}
      <div className="max-h-[380px] overflow-y-auto p-4 bg-slate-950/90 font-mono text-xs text-slate-200 leading-relaxed select-text">
        {rawText.trim().length === 0 ? (
          <div className="text-slate-400 italic py-8 text-center">
            No readable text detected in document. Try uploading a clearer document.
          </div>
        ) : (
          lines.map((line, idx) => {
            const isMatch = searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());
            return (
              <div
                key={idx}
                className={`flex gap-3 py-0.5 hover:bg-white/5 rounded px-1 ${
                  isMatch ? 'bg-blue-600/30 text-cyan-200 font-semibold' : ''
                }`}
              >
                <span className="w-8 shrink-0 text-slate-400 select-none text-right font-mono">
                  {idx + 1}
                </span>
                <span className="whitespace-pre-wrap break-all">{line || ' '}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
