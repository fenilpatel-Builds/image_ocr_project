import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Plus, Trash2, Save, Sparkles, ShieldCheck, Check } from 'lucide-react';

const CATEGORIES = [
  { id: 'invoice', label: 'Bill / Commercial Invoice' },
  { id: 'passport', label: 'Passport (ICAO MRZ)' },
  { id: 'receipt', label: 'Retail / Cafe Receipt' },
  { id: 'id_card', label: 'Identity Card / Driver License' },
  { id: 'certificate', label: 'Certificate / Award' },
  { id: 'general', label: 'General Text Document' }
];

export function ExtractedFieldsViewer({
  initialFields = [],
  documentType = 'general',
  onCategoryChange,
  onVerifyAndSave,
  saving = false
}) {
  const [fields, setFields] = useState(initialFields);
  const [hasEdits, setHasEdits] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  const handleFieldChange = (index, newValue) => {
    const updated = [...fields];
    updated[index] = {
      ...updated[index],
      value: newValue,
      user_edited: 1
    };
    setFields(updated);
    setHasEdits(true);
  };

  const handleRemoveField = (index) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
    setHasEdits(true);
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const newField = {
      name: newFieldName.trim(),
      value: newFieldValue.trim(),
      type: 'string',
      confidence: 1.0,
      rating: 'HIGH',
      verified: 1,
      user_edited: 1
    };
    setFields([...fields, newField]);
    setNewFieldName('');
    setNewFieldValue('');
    setShowAddModal(false);
    setHasEdits(true);
  };

  const needsReviewCount = fields.filter(f => f.rating === 'NEEDS_REVIEW' || f.confidence < 0.65).length;

  return (
    <div className="glass-panel p-5 flex flex-col gap-5 border-white/10">
      
      {/* Category selector & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white text-base">Structured Extraction Verification</h3>
          </div>
          <p className="text-xs text-slate-400">
            Review and correct extracted values before committing to the permanent database record.
          </p>
        </div>

        {/* Document Classification Override */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Category:</label>
          <select
            value={documentType}
            onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
            className="text-xs font-semibold bg-slate-900 border border-white/15 text-cyan-300 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Review Warning if low confidence fields exist */}
      {needsReviewCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>{needsReviewCount} field(s)</strong> flagged with lower confidence or format anomaly. Please inspect before saving.
            </span>
          </div>
        </div>
      )}

      {/* Fields List */}
      <div className="flex flex-col gap-3">
        {fields.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm italic bg-slate-950/40 rounded-xl border border-dashed border-white/10">
            No structured fields extracted yet. Click "Add Custom Field" to enter manually.
          </div>
        ) : (
          fields.map((field, idx) => {
            const confPct = Math.round((field.confidence || 0.85) * 100);
            const isNotice = field.type === 'notice';
            const isJson = field.type === 'json';

            if (isNotice) {
              return (
                <div key={idx} className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-200 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-300 block">{field.name}</span>
                    <span className="text-slate-300 leading-relaxed">{field.value}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`glass-card p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  field.rating === 'NEEDS_REVIEW' || confPct < 65
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-white/10'
                }`}
              >
                {/* Field Label & Confidence Badge */}
                <div className="sm:w-1/3 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">{field.name}</span>
                    {field.user_edited === 1 && (
                      <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                        Edited
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    {confPct >= 85 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" />
                        <span>High ({confPct}%)</span>
                      </span>
                    ) : confPct >= 65 ? (
                      <span className="inline-flex items-center gap-1 text-amber-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Medium ({confPct}%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        <span>Review ({confPct}%)</span>
                      </span>
                    )}

                    {field.validation && (
                      <span className="text-[10px] text-slate-400">| {field.validation}</span>
                    )}
                  </div>
                </div>

                {/* Editable Field Input */}
                <div className="flex-1 flex items-center gap-2">
                  {isJson ? (
                    <textarea
                      rows={3}
                      value={field.value}
                      onChange={(e) => handleFieldChange(idx, e.target.value)}
                      className="form-input font-mono text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldChange(idx, e.target.value)}
                      className="form-input text-xs"
                      placeholder="Enter field value..."
                    />
                  )}

                  <button
                    onClick={() => handleRemoveField(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Remove Field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Field Form */}
      {showAddModal ? (
        <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="Field Label (e.g. Account Number)"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            className="form-input text-xs"
          />
          <input
            type="text"
            placeholder="Field Value"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            className="form-input text-xs"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleAddField} className="btn-primary text-xs py-1.5">
              Add
            </button>
            <button onClick={() => setShowAddModal(false)} className="btn-secondary text-xs py-1.5">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddModal(true)}
          className="self-start text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Field</span>
        </button>
      )}

      {/* Verification Notice */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Clicking <strong>Verify & Save</strong> permanently persists the verified structured record into the application database and writes an immutable entry in the audit trail.
        </span>
      </div>

      {/* Save / Verify CTA */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
        <button
          onClick={() => onVerifyAndSave(fields, documentType)}
          disabled={saving || fields.length === 0}
          className="btn-emerald text-sm py-2 px-5 font-semibold"
        >
          {saving ? (
            <>
              <Save className="w-4 h-4 animate-spin" />
              <span>Saving to Database...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Save Record</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
