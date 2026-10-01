import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FileText, Search, Filter, Eye, Download, Trash2, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { DocumentDetailModal } from './DocumentDetailModal';

const STATUS_FILTERS = [
  'ALL',
  'UPLOADED',
  'PROCESSING',
  'OCR_COMPLETED',
  'EXTRACTION_COMPLETED',
  'NEEDS_REVIEW',
  'VERIFIED',
  'SAVED',
  'FAILED'
];

export function DocumentHistory() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDocId, setSelectedDocId] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDocuments({ status: statusFilter, search });
      setDocuments(res.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document record?')) return;
    try {
      await api.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Document Repository</h2>
          <p className="text-xs text-slate-400">
            {user?.role === 'admin' || user?.role === 'auditor'
              ? 'Showing all citizen and enterprise documents across the organization.'
              : 'Showing documents uploaded by your account.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input text-xs pl-9 pr-3 py-1.5 w-48 sm:w-64"
            />
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input text-xs py-1.5 px-3 w-auto bg-slate-900 text-slate-200 cursor-pointer"
          >
            {STATUS_FILTERS.map(st => (
              <option key={st} value={st}>{st === 'ALL' ? 'All Statuses' : st}</option>
            ))}
          </select>

          <button
            onClick={fetchDocuments}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Documents Table Container */}
      <div className="glass-panel overflow-hidden border-white/10">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Fetching records from database...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 text-sm">{error}</div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm italic">
            No document records match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-white/10 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fields</th>
                  <th className="py-3 px-4">OCR Confidence</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-white group-hover:text-cyan-300 transition block truncate max-w-[200px]">
                            {doc.file_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(doc.file_size / 1024).toFixed(0)} KB • {doc.user_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 capitalize font-medium text-slate-300">
                      {doc.document_type || 'General'}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`badge badge-${doc.status}`}>
                        {doc.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {doc.field_count > 0 ? (
                        <span className="text-cyan-400 font-semibold">{doc.field_count} fields</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {doc.avg_confidence ? (
                        <span className={doc.avg_confidence >= 80 ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                          {Math.round(doc.avg_confidence)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedDocId(doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <a
                          href={`/api/documents/${doc.id}/file`}
                          download={doc.file_name}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                          title="Download Original"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      {selectedDocId && (
        <DocumentDetailModal
          documentId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
          onRefresh={fetchDocuments}
        />
      )}

    </div>
  );
}
