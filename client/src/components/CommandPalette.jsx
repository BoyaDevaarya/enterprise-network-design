import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Network, FolderLock, Grid, Terminal, FileCode, Search, ShieldAlert, Sparkles, Building, Users, History, Inbox, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../services/api';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleSimulate = async (srcDept, dstDept, test) => {
    onClose();
    try {
      const res = await apiRequest('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({ srcDept, dstDept, test })
      });
      toast.info(`Simulated ${test.toUpperCase()}: ${srcDept} → ${dstDept}`, {
        description: res.reason
      });
      navigate('/test-lab');
    } catch (err) {
      toast.error('Simulation failed', { description: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-xl surface-panel border-cyan-500/40 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 bg-slate-900/95">
        <Command label="Command Palette" className="w-full">
          <div className="flex items-center px-4 border-b border-slate-800">
            <Search className="w-4 h-4 text-cyan-400 mr-2.5 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command, navigate console pages, or inject packets..."
              className="w-full bg-transparent py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
            />
            <kbd className="px-2 py-0.5 text-[10px] bg-slate-800 rounded text-slate-400 font-mono border border-slate-700">ESC</kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs font-mono">
            <Command.Empty className="p-6 text-center text-slate-500">
              No matching operations found.
            </Command.Empty>

            <Command.Group heading="Navigation Pages" className="text-[10px] font-mono text-cyan-400 px-3 py-1.5 uppercase font-bold tracking-wider">
              <Command.Item
                onSelect={() => handleNavigate('/')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                <Network className="w-4 h-4 text-cyan-400" />
                <span>Live Network Map & Topology</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/resources')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                <FolderLock className="w-4 h-4 text-blue-400" />
                <span>Portal Resources & Access Catalog</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/matrix')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                <Grid className="w-4 h-4 text-purple-400" />
                <span>Policy Matrix 2.0 & Exposure Heatmaps</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/test-lab')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Packet Tracer Diagnostic Lab</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/compliance')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Security Posture & Compliance Gauge</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/config')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>Cisco IOS CLI Configuration Generator</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="RBAC Simulation Switcher" className="text-[10px] font-mono text-amber-400 px-3 py-1.5 uppercase font-bold tracking-wider mt-2 border-t border-slate-800/80 pt-2">
              {['HR', 'Finance', 'IT', 'Sales', 'Management', 'Servers'].map((dept) => (
                <Command.Item
                  key={dept}
                  onSelect={() => {
                    useAuthStore.getState().setPreviewDept(dept);
                    toast.success(`RBAC Simulation active: ${dept} Department`);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-amber-500/15 hover:text-amber-300 cursor-pointer transition-colors"
                >
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>Simulate {dept} Department View & ACL Permissions</span>
                </Command.Item>
              ))}
              <Command.Item
                onSelect={() => {
                  useAuthStore.getState().setPreviewDept(null);
                  toast.info('Exited Preview Mode');
                  onClose();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Exit Simulation (Return to Default Role)</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Quick Diagnostics & Threat Injection" className="text-[10px] font-mono text-purple-400 px-3 py-1.5 uppercase font-bold tracking-wider mt-2 border-t border-slate-800/80 pt-2">
              <Command.Item
                onSelect={() => handleSimulate('Sales', 'Servers', 'http')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-purple-500/15 hover:text-purple-300 cursor-pointer transition-colors"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Simulate Sales HTTP → Servers (Intranet)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSimulate('Sales', 'Servers', 'ping')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-purple-500/15 hover:text-purple-300 cursor-pointer transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Simulate Sales Ping → Servers (Blocked by Rule)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSimulate('HR', 'Finance', 'ping')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-purple-500/15 hover:text-purple-300 cursor-pointer transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Simulate HR Ping → Finance (VLAN Isolated)</span>
              </Command.Item>
              <Command.Item
                onSelect={async () => {
                  onClose();
                  try {
                    const res = await apiRequest('/api/admin/audit/verify');
                    if (res.tamperProof) {
                      toast.success('SHA-256 Audit Log Chain Validated', { description: 'All log blocks are cryptographic tamper-proof.' });
                    } else {
                      toast.error('Audit Chain Integrity Violation!', { description: res.details?.reason || 'Hash mismatch detected.' });
                    }
                  } catch (err) {
                    toast.error('Verification check failed', { description: err.message });
                  }
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Verify SHA-256 Cryptographic Audit Chain Integrity</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>

        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between text-[11px] text-slate-500 font-mono">
          <span>Press ESC or click outside to close</span>
          <span className="text-cyan-400 font-semibold">EnterpriseNet Command Palette</span>
        </div>
      </div>
    </div>
  );
}
