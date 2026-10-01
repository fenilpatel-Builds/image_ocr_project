import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Shield, User, Activity, History, ScanLine, LogOut, CheckCircle } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, switchRole, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Platform Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">DocuScan<span className="text-cyan-400">AI</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Local WASM
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Client-Side OCR & Structured Document Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'scan'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Scan & Extract</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Documents</span>
          </button>

          {(user?.role === 'admin' || user?.role === 'auditor') && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Audit & Analytics</span>
            </button>
          )}
        </nav>

        {/* User Role Switcher & Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 rounded-xl p-1.5 pl-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                <span className="text-[10px] text-slate-400 capitalize">{user.email}</span>
              </div>

              {/* 1-Click Role Switcher for Evaluators */}
              <div className="relative group">
                <select
                  value={user.role}
                  onChange={(e) => switchRole(e.target.value)}
                  className="text-xs font-semibold uppercase tracking-wider rounded-lg px-2 py-1 bg-slate-800 text-cyan-300 border border-white/15 focus:outline-none cursor-pointer"
                  title="Switch Role for Evaluation"
                >
                  <option value="user">User (Citizen)</option>
                  <option value="admin">Admin (All Access)</option>
                  <option value="auditor">Auditor (Compliance)</option>
                </select>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => switchRole('user')}
              className="btn-primary text-xs"
            >
              Sign In Demo
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
