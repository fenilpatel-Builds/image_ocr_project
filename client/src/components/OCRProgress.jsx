import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Cpu, Layers } from 'lucide-react';

export function OCRProgress({ progress = 0, message = 'Processing...', stage = 'ocr' }) {
  const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));

  const steps = [
    { label: 'Document uploaded & verified', done: true },
    { label: 'Client-side image preprocessed (Canvas)', done: progress >= 0.15 },
    { label: 'Local Tesseract.js Worker initialized (WASM)', done: progress >= 0.35 },
    { label: 'Text recognition & neural extraction in progress', done: progress >= 0.70 },
    { label: 'Heuristic classification & structured field parsing', done: progress >= 0.95 }
  ];

  return (
    <div className="glass-panel p-6 border-blue-500/30 flex flex-col gap-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Local OCR Engine Processing</h3>
            <p className="text-xs text-slate-400">Running client-side in browser Web Worker</p>
          </div>
        </div>

        <span className="text-lg font-bold font-mono text-cyan-400">{percentage}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-white/10 p-0.5">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/30"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Live status text */}
      <div className="flex items-center gap-2 text-sm text-cyan-300 font-medium bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
        <span>{message}</span>
      </div>

      {/* Checklist of steps */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        {steps.map((st, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs">
            {st.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-900/80 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                {i + 1}
              </div>
            )}
            <span className={st.done ? 'text-slate-200' : 'text-slate-400'}>{st.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
