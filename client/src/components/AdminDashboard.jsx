import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Activity, Shield, Download, FileText, CheckCircle2, AlertTriangle, Users, Cpu, Clock, RefreshCw } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.getAuditStats(),
        api.getAuditLogs(150)
      ]);
      setStats(statsRes.stats);
      setLogs(logsRes.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const handleExport = () => {
    window.open('/api/audit/export', '_blank');
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
        <span>Loading system analytics and security audit trail...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Compliance & System Audit Console</h2>
          </div>
          <p className="text-xs text-slate-400">
            Immutable traceability logs for document ingestion, client-side OCR execution, and verified human corrections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAuditData}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            className="btn-primary text-xs py-1.5 px-3 bg-purple-600 hover:bg-purple-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail (JSON)</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="glass-panel p-4 flex flex-col gap-1 border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Documents</span>
            <span className="text-2xl font-bold text-white font-mono">{stats.totalDocs}</span>
            <span className="text-[10px] text-slate-400">Stored in SQLite</span>
          </div>

          <div className="glass-panel p-4 flex flex-col gap-1 border-emerald-500/20 bg-emerald-500/5">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Verified Records</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">{stats.verifiedDocs}</span>
            <span className="text-[10px] text-emerald-300">Human verified & saved</span>
          </div>

          <div className="glass-panel p-4 flex flex-col gap-1 border-amber-500/20 bg-amber-500/5">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Pending Review</span>
            <span className="text-2xl font-bold text-amber-400 font-mono">{stats.pendingReview}</span>
            <span className="text-[10px] text-amber-300">Awaiting user check</span>
          </div>

          <div className="glass-panel p-4 flex flex-col gap-1 border-blue-500/20 bg-blue-500/5">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Average Confidence</span>
            <span className="text-2xl font-bold text-blue-400 font-mono">{stats.avgConfidence}%</span>
            <span className="text-[10px] text-blue-300">Local Tesseract WASM</span>
          </div>

          <div className="glass-panel p-4 flex flex-col gap-1 border-purple-500/20 bg-purple-500/5">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Active Users</span>
            <span className="text-2xl font-bold text-purple-400 font-mono">{stats.totalUsers}</span>
            <span className="text-[10px] text-purple-300">Role-governed RBAC</span>
          </div>
        </div>
      )}

      {/* Category Breakdown & Audit Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Category Breakdown */}
        <div className="glass-panel p-4 flex flex-col gap-3 lg:col-span-1 border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Document Categories
          </h3>
          <div className="flex flex-col gap-2">
            {(stats?.docsByType || []).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-white/5">
                <span className="capitalize font-medium text-slate-300">{cat.document_type || 'General'}</span>
                <span className="font-mono font-bold text-cyan-400">{cat.count}</span>
              </div>
            ))}
            {(!stats?.docsByType || stats.docsByType.length === 0) && (
              <p className="text-xs text-slate-400 italic">No categorized documents yet.</p>
            )}
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="glass-panel overflow-hidden lg:col-span-3 border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Traceability Event Log (Latest {logs.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Zero sensitive PII logged</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 uppercase font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-cyan-300">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 truncate max-w-[150px]">
                      {log.file_name || log.document_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.actor_name || 'System'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                        {log.actor_role || 'system'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] truncate max-w-[200px]" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
