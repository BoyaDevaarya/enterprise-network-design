import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { FileCode, Copy, Download, GitCompare, Check } from 'lucide-react';
import { toast } from 'sonner';

const DEVICES = [
  { id: 'router', label: 'R1-EDGE Router' },
  { id: 'core', label: 'CORE-SW Switch' },
  { id: 'sw-hr', label: 'SW-HR Access Switch' },
  { id: 'sw-finance', label: 'SW-FINANCE Access Switch' },
  { id: 'sw-it', label: 'SW-IT Access Switch' },
  { id: 'sw-sales', label: 'SW-SALES Access Switch' },
  { id: 'sw-mgmt', label: 'SW-MGMT Access Switch' },
  { id: 'sw-servers', label: 'SW-SERVERS Access Switch' }
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
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" /> Cisco IOS CLI Configuration Generator
            </h2>
            <p className="text-xs text-slate-400">Dynamically compiled Cisco IOS router and switch configuration files</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'cli' ? 'diff' : 'cli')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                viewMode === 'diff' ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{viewMode === 'diff' ? 'Showing CLI Diff' : 'View Config Diff'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-glowCyan cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
          </div>
        </div>

        {/* Device selector tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800">
          {DEVICES.map((dev) => (
            <button
              key={dev.id}
              onClick={() => setSelectedDevice(dev.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                selectedDevice === dev.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glowCyan font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {dev.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monospace Viewer */}
      <div className="glass-panel p-5 relative">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs">
            Compiling Cisco IOS commands for {selectedDevice}...
          </div>
        ) : (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs overflow-auto max-h-[600px] leading-relaxed shadow-inner">
            {configText ? (
              configText.split('\n').map((line, idx) => {
                let colorClass = 'text-slate-300';
                if (line.startsWith('!')) colorClass = 'text-slate-500 italic';
                else if (line.startsWith('+')) colorClass = 'text-emerald-400 font-bold bg-emerald-950/30 px-1';
                else if (line.startsWith('-')) colorClass = 'text-rose-400 font-bold bg-rose-950/30 px-1';
                else if (line.startsWith('interface') || line.startsWith('vlan') || line.startsWith('ip access-list')) colorClass = 'text-cyan-400 font-bold';
                else if (line.startsWith('ip address') || line.startsWith('ip dhcp')) colorClass = 'text-purple-300';

                return (
                  <div key={idx} className={colorClass}>
                    {line || ' '}
                  </div>
                );
              })
            ) : (
              <span className="text-slate-600">No CLI output available.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
