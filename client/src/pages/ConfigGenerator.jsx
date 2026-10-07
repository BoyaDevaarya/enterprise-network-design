import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { FileCode, Copy, Download, GitCompare, Check, Terminal, Cpu } from 'lucide-react';
import { toast } from 'sonner';

const DEVICES = [
  { id: 'router', label: 'R1-EDGE Router' },
  { id: 'core', label: 'CORE-SW Switch' },
  { id: 'sw-hr', label: 'SW-HR Switch' },
  { id: 'sw-finance', label: 'SW-FINANCE Switch' },
  { id: 'sw-it', label: 'SW-IT Switch' },
  { id: 'sw-sales', label: 'SW-SALES Switch' },
  { id: 'sw-mgmt', label: 'SW-MGMT Switch' },
  { id: 'sw-servers', label: 'SW-SERVERS Switch' }
];

export default function ConfigGenerator() {
  const { user } = useAuthStore();
  const [selectedDevice, setSelectedDevice] = useState('router');
  const [viewMode, setViewMode] = useState('cli'); // 'cli' | 'diff'
  const [copied, setCopied] = useState(false);

  const { data: configText, isLoading } = useQuery({
    queryKey: ['config', selectedDevice, viewMode],
    queryFn: () => apiRequest(`/api/config/${selectedDevice}${viewMode === 'diff' ? '/diff' : ''}`)
  });

  const handleCopy = () => {
    if (configText) {
      navigator.clipboard.writeText(configText);
      setCopied(true);
      toast.success('Cisco IOS CLI copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (configText) {
      const blob = new Blob([configText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedDevice}-ios-config.txt`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${selectedDevice}-ios-config.txt`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="surface-panel p-6 space-y-4 border-cyan-500/30 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                CLI COMPILER
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" /> Cisco IOS CLI Configuration Generator
            </h2>
            <p className="text-xs text-slate-400 font-mono">Dynamically compiled Cisco IOS router and switch configuration files</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setViewMode(viewMode === 'cli' ? 'diff' : 'cli')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                viewMode === 'diff' 
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)] font-bold' 
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{viewMode === 'diff' ? 'Mode: Showing CLI Diff' : 'View Config Diff'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
          </div>
        </div>

        {/* Device selector tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-800">
          {DEVICES.map((dev) => (
            <button
              key={dev.id}
              onClick={() => setSelectedDevice(dev.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                selectedDevice === dev.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {dev.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monospace Viewer */}
      <div className="surface-panel p-5 relative border-cyan-500/20 shadow-2xl bg-slate-950">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-mono text-xs">
            Compiling Cisco IOS syntax trees for {selectedDevice}...
          </div>
        ) : (
          <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 font-mono text-xs overflow-auto max-h-[620px] leading-relaxed shadow-inner relative">
            <div className="scanline-overlay absolute inset-0 pointer-events-none opacity-15" />
            {configText ? (
              configText.split('\n').map((line, idx) => {
                let colorClass = 'text-slate-300';
                if (line.startsWith('!')) colorClass = 'text-slate-500 italic';
                else if (line.startsWith('+')) colorClass = 'text-emerald-400 font-bold bg-emerald-950/40 px-1.5 rounded';
                else if (line.startsWith('-')) colorClass = 'text-rose-400 font-bold bg-rose-950/40 px-1.5 rounded';
                else if (line.startsWith('interface') || line.startsWith('vlan') || line.startsWith('ip access-list')) colorClass = 'text-cyan-400 font-bold';
                else if (line.startsWith('ip address') || line.startsWith('ip dhcp')) colorClass = 'text-purple-300 font-semibold';
                else if (line.startsWith('permit') || line.startsWith('deny')) colorClass = line.startsWith('permit') ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold';

                return (
                  <div key={idx} className={`flex gap-3 leading-6 ${colorClass}`}>
                    <span className="text-slate-600 select-none text-[10px] w-8 text-right shrink-0">{idx + 1}</span>
                    <span>{line || ' '}</span>
                  </div>
                );
              })
            ) : (
              <span className="text-slate-600">No CLI output generated for this profile.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
