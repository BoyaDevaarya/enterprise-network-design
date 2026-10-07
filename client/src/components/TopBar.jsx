import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useDemoStore } from '../store/demoStore';
import { Shield, Eye, LogOut, Terminal, Activity, X } from 'lucide-react';

const DEPARTMENTS = ['HR', 'Finance', 'IT', 'Sales', 'Management', 'Servers'];

export default function TopBar({ onOpenCommandPalette }) {
  const { user, logout, previewDept, setPreviewDept } = useAuthStore();
  const startTour = useDemoStore((state) => state.startTour);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 w-full glass-panel !rounded-none !border-x-0 !border-t-0 px-4 lg:px-6 py-3 flex items-center justify-between">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-slate-100 flex items-center gap-2">
              EnterpriseNet <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">ACCESS PORTAL</span>
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live SSE Connection Active</span>
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Command Palette</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 rounded text-slate-300 font-mono">⌘K</kbd>
        </button>

        {/* Guided Demo Tour */}
        <button
          onClick={startTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-400 hover:bg-cyan-500/20 font-medium transition-colors"
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guided Demo</span>
        </button>

        {/* Admin Preview As Department Selector */}
        {isAdmin && (
          <div className="relative flex items-center">
            <select
              value={previewDept || ''}
              onChange={(e) => setPreviewDept(e.target.value || null)}
              className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Preview Dept (Off)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  Preview as {dept}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Info & Role Pill */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">{user?.name || user?.email}</div>
            <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-mono">
              <span>{user?.department}</span>
              <span className={`px-1 rounded text-[9px] ${isAdmin ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-slate-800 text-slate-300'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Active Preview Dept Floating Banner */}
      {previewDept && (
        <div className="absolute top-full left-0 right-0 bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-4 py-1.5 text-xs font-medium flex items-center justify-between z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 animate-pulse" />
            <span>
              <strong>PREVIEW MODE ACTIVE:</strong> Viewing portal resources and restrictions as <strong>{previewDept}</strong> department. Real session is unchanged.
            </span>
          </div>
          <button
            onClick={() => setPreviewDept(null)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px]"
          >
            <X className="w-3 h-3" /> Exit Preview
          </button>
        </div>
      )}
    </header>
  );
}
