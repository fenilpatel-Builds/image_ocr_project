import React from 'react';
import { Check, Clock, AlertTriangle, CheckCircle2, Save, FileUp, Cpu, Sparkles } from 'lucide-react';

const STEPS = [
  { key: 'UPLOADED', label: 'Uploaded', icon: FileUp },
  { key: 'PROCESSING', label: 'Preprocessing', icon: Sparkles },
  { key: 'OCR_COMPLETED', label: 'OCR Done', icon: Cpu },
  { key: 'EXTRACTION_COMPLETED', label: 'Extracted', icon: Clock },
  { key: 'NEEDS_REVIEW', label: 'Review', icon: AlertTriangle },
  { key: 'VERIFIED', label: 'Verified', icon: CheckCircle2 },
  { key: 'SAVED', label: 'Saved', icon: Save }
];

export function StatusStepper({ currentStatus }) {
  if (currentStatus === 'FAILED') {
    return (
      <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between text-rose-400 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Processing Failed</span>
        </div>
        <span className="text-xs text-rose-300">Check image quality or select another document</span>
      </div>
    );
  }

  // Get index of current status
  let currentIndex = STEPS.findIndex(s => s.key === currentStatus);
  if (currentIndex === -1) {
    if (currentStatus === 'NEEDS_REVIEW') currentIndex = 4;
    else currentIndex = 0;
  }

  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting progress line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-0">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex || currentStatus === 'SAVED';
          const isCurrent = idx === currentIndex && currentStatus !== 'SAVED';
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 pulse-glow'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[11px] font-medium mt-1.5 whitespace-nowrap transition-colors ${
                  isCurrent ? 'text-blue-400 font-bold' : isDone ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
