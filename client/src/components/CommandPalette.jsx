import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Network, FolderLock, Grid, Terminal, FileCode, Search, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../services/api';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open triggered from parent
        }
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
      toast.info(`Simulated ${test.toUpperCase()}: ${srcDept} -> ${dstDept}`, {
        description: res.reason
      });
      navigate('/test-lab');
    } catch (err) {
      toast.error('Simulation failed', { description: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="w-full max-w-xl surface-panel border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <Command label="Command Palette" className="w-full">
          <div className="flex items-center px-4 border-b border-zinc-800">
            <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command, search pages, or run network diagnostics..."
              className="w-full bg-transparent py-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            <kbd className="px-2 py-0.5 text-[10px] bg-zinc-800 rounded text-zinc-400 font-mono">ESC</kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
            <Command.Empty className="p-4 text-center text-zinc-500">
              No matching operations found.
            </Command.Empty>

            <Command.Group heading="Navigation Pages" className="text-[10px] font-mono text-blue-500 px-2 py-1 uppercase">
              <Command.Item
                onSelect={() => handleNavigate('/')}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-zinc-300 hover:bg-blue-600/10 hover:text-blue-500 cursor-pointer"
              >
                <Network className="w-4 h-4" />
                <span>Live Network Map & Topology</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/resources')}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-zinc-300 hover:bg-blue-600/10 hover:text-blue-500 cursor-pointer"
              >
                <FolderLock className="w-4 h-4" />
                <span>Portal Resources & Access View</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/matrix')}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-zinc-300 hover:bg-blue-600/10 hover:text-blue-500 cursor-pointer"
              >
                <Grid className="w-4 h-4" />
                <span>Policy Matrix 2.0 & Heatmaps</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/test-lab')}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-zinc-300 hover:bg-blue-600/10 hover:text-blue-500 cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                <span>Packet Tracer Test Lab</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleNavigate('/config')}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-zinc-300 hover:bg-blue-600/10 hover:text-blue-500 cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                <span>Cisco IOS Config Generator</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Quick Diagnostics & Actions" className="text-[10px] font-mono text-purple-400 px-2 py-1 uppercase mt-2">
              <Command.Item
                onSelect={() => handleSimulate('Sales', 'Servers', 'http')}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-zinc-300 hover:bg-purple-500/10 hover:text-purple-300 cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Simulate Sales HTTP to Servers (Intranet)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSimulate('Sales', 'Servers', 'ping')}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-zinc-300 hover:bg-purple-500/10 hover:text-purple-300 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Simulate Sales Ping to Servers (Blocked)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSimulate('HR', 'Finance', 'ping')}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-zinc-300 hover:bg-purple-500/10 hover:text-purple-300 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Simulate HR Ping to Finance (Isolating Rule)</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>

        <div className="p-3 bg-zinc-900/60 border-t border-zinc-800 flex justify-between text-[11px] text-zinc-500">
          <span>Press ESC or click outside to dismiss</span>
          <span>EnterpriseNet Command Palette</span>
        </div>
      </div>
    </div>
  );
}
