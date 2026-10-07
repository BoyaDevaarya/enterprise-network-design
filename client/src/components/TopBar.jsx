import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useDemoStore } from '../store/demoStore';
import { Shield, Eye, LogOut, Terminal, Activity, X, Radio, Cpu, Sparkles } from 'lucide-react';

const DEPARTMENTS = ['HR', 'Finance', 'IT', 'Sales', 'Management', 'Servers'];

export default function TopBar({ onOpenCommandPalette }) {
  const { user, logout, previewDept, setPreviewDept } = useAuthStore();
  const startTour = useDemoStore((state) => state.startTour);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 w-full surface-panel !rounded-none !border-x-0 !border-t-0 border-b border-cyan-500/20 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-glass backdrop-blur-2xl">
      {/* Brand & Live Connection Indicator */}
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-violet-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all group-hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] group-hover:scale-105">
              <Shield className="w-5 h-5 text-cyan-300 transition-transform group-hover:rotate-6" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">EnterpriseNet</span>
              </h1>
              <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                CONSOLE 2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SOC ZERO-TRUST CLUSTER</span>
            </p>
          </div>
        </div>

        {/* Live SSE Pulse Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold">SSE LIVE SYNC</span>
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="text-[10px] opacity-75">12ms</span>
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          aria-label="Open command palette (Command + K)"
          title="Open Command Palette (⌘K or Ctrl+K)"
          className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-slate-900/80 border border-slate-700/70 hover:border-cyan-500/50 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all shadow-inner group cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-[11px]">Command Palette</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 rounded text-slate-400 font-mono border border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-300">
            ⌘K
          </kbd>
        </button>

        {/* Guided Demo Tour */}
        <button
          onClick={startTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/40 text-xs text-cyan-300 hover:text-white hover:bg-cyan-500/25 font-semibold transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="hidden sm:inline">Guided Tour</span>
        </button>

        {/* Admin Preview As Department Selector */}
        {isAdmin && (
          <div className="relative flex items-center">
            <select
              value={previewDept || ''}
              onChange={(e) => setPreviewDept(e.target.value || null)}
              className="bg-slate-900/90 text-xs font-mono text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition-colors shadow-inner"
            >
              <option value="">Preview Mode (Off)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  Simulate {dept} Dept
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Identity Profile Card */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/30 via-indigo-500/30 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center text-xs font-bold font-mono text-cyan-200 shrink-0 shadow-sm">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="hidden lg:block text-right">
            <div className="text-xs font-semibold text-slate-100 line-clamp-1">{user?.name || user?.email}</div>
            <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1.5 font-mono">
              <span className="text-cyan-400 font-semibold">{user?.department}</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                isAdmin 
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-600/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out of console"
          className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Active Preview Dept Floating Banner */}
      {previewDept && (
        <div className="absolute top-full left-0 right-0 bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs font-medium flex items-center justify-between z-40 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span>
              <strong>PREVIEW SIMULATION ACTIVE:</strong> Viewing portal resources and ACL restrictions as <span className="font-bold font-mono text-amber-300 underline underline-offset-2">{previewDept}</span> department.
            </span>
          </div>
          <button
            onClick={() => setPreviewDept(null)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition-colors border border-amber-500/40 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Exit Simulation
          </button>
        </div>
      )}
    </header>
  );
}
