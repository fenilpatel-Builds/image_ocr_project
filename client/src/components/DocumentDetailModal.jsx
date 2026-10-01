import React, { useState, useEffect } from 'react';
import { X, Eye, FileText, CheckCircle2, Clock, ShieldCheck, Download, Trash2, Cpu, Sparkles } from 'lucide-react';
import { api } from '../api/client';

export function DocumentDetailModal({ documentId, onClose, onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('fields'); // 'fields', 'raw', 'audit'

  useEffect(() => {
    if (!documentId) return;
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const res = await api.getDocument(documentId);
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [documentId]);

  if (!documentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base truncate max-w-md">
                {data?.document?.file_name || 'Document Inspection'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="capitalize text-cyan-300 font-medium">Type: {data?.document?.document_type}</span>
                <span>•</span>
                <span>ID: {data?.document?.id}</span>
                <span>•</span>
                <span className={`badge badge-${data?.document?.status}`}>
                  {data?.document?.status}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
            <Clock className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Loading document details & audit records...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
            
            {/* Left Column: Original File Preview */}
            <div className="bg-slate-950/80 border-r border-white/10 p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Original Document Artifact
                </span>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-900/50 flex items-center justify-center max-h-[500px]">
                  <img
                    src={`/api/documents/${data.document.id}/file`}
                    alt="Original Document"
                    className="max-h-[480px] w-auto max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Uploaded by: <strong className="text-slate-200">{data.document.user_name}</strong></span>
                <span>Size: {(data.document.file_size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* Right Column: Tabbed Information */}
            <div className="flex flex-col h-full overflow-hidden bg-slate-900/50">
              
              {/* Tab Navigation */}
              <div className="flex items-center border-b border-white/10 px-4 bg-slate-950/40">
                <button
                  onClick={() => setActiveTab('fields')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'fields'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Verified Fields ({data.fields?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('raw')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'raw'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Raw OCR Text</span>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'audit'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Audit Trail ({data.logs?.length || 0})</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 p-5 overflow-y-auto">
                {activeTab === 'fields' && (
                  <div className="flex flex-col gap-3">
                    {data.fields.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No structured fields extracted.</p>
                    ) : (
                      data.fields.map((field, idx) => (
                        <div key={idx} className="glass-card p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300">{field.field_name}</span>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Conf: {Math.round(field.confidence * 100)}%
                            </span>
                          </div>
                          <span className="text-xs text-white font-medium bg-slate-950/50 p-2 rounded border border-white/5">
                            {field.field_value || '—'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'raw' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
                      <span>Engine: {data.ocrResult?.ocr_engine || 'Tesseract.js v5 Local WASM'}</span>
                      <span>Confidence: {data.ocrResult?.confidence_avg || 0}%</span>
                    </div>
                    <pre className="p-4 bg-slate-950/90 rounded-xl font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed border border-white/10 max-h-[420px] overflow-y-auto">
                      {data.ocrResult?.raw_text || 'No raw text recorded.'}
                    </pre>
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="flex flex-col gap-3">
                    {data.logs.map((log, idx) => (
                      <div key={idx} className="flex gap-3 text-xs items-start">
                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <div className="flex-1 bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-200">{log.action}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Actor: {log.actor_name || 'System'} ({log.actor_role || 'system'})
                          </p>
                          {log.details && (
                            <p className="text-[11px] text-slate-300 font-mono mt-1 bg-slate-950/60 p-1.5 rounded">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
