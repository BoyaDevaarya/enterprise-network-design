import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Grid, Flame, Plus, Trash2, CheckCircle2, ShieldAlert, AlertTriangle, Undo, Lock, Unlock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import SafeChangeModal from '../components/SafeChangeModal';

export default function PolicyMatrix() {
  const queryClient = useQueryClient();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null); // { src, dst }
  const [pendingSafeChange, setPendingSafeChange] = useState(null);

  const { data: matrix, isLoading: loadingMatrix } = useQuery({
    queryKey: ['policy-matrix'],
    queryFn: () => apiRequest('/api/policy/matrix')
  });

  const { data: rules, isLoading: loadingRules } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiRequest('/api/admin/rules')
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiRequest('/api/network').then(res => res.departments)
  });

  const handleCellClick = (src, dst, currentAction) => {
    const targetAction = currentAction === 'permit' ? 'deny' : 'permit';

    if (targetAction === 'permit') {
      // Loosening access -> triggers Safe-Change modal flow
      setPendingSafeChange({
        src,
        dst,
        service: 'any',
        action: 'permit'
      });
    } else {
      // Making access stricter (DENY) -> applies immediately
      applyDirectFlip(src, dst, 'deny');
    }
  };

  const applyDirectFlip = async (src, dst, action) => {
    try {
      const res = await apiRequest(`/api/admin/matrix/${src}/${dst}`, {
        method: 'PUT',
        body: JSON.stringify({ action })
      });

      toast.success(`Matrix updated: ${src} → ${dst} (${action.toUpperCase()})`, {
        action: {
          label: 'Undo',
          onClick: () => applyDirectFlip(src, dst, action === 'permit' ? 'deny' : 'permit')
        }
      });
      queryClient.invalidateQueries({ queryKey: ['policy-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    } catch (err) {
      toast.error('Matrix update failed', { description: err.message });
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await apiRequest(`/api/admin/rules/${ruleId}`, { method: 'DELETE' });
      toast.success('Rule deleted from firewall');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['policy-matrix'] });
    } catch (err) {
      toast.error('Failed to delete rule', { description: err.message });
    }
  };

  if (loadingMatrix || loadingRules) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-xs surface-panel border-cyan-500/20">
        Compiling live stateful firewall matrix & evaluating ACL permutations...
      </div>
    );
  }

  const deptList = departments || [];

  return (
    <div className="space-y-6">
      {/* Top Controls & Exposure Heatmap Toggle */}
      <div className="surface-panel p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              ACL CONTROL HUB
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" /> Policy Matrix 2.0 Control Center
          </h2>
          <p className="text-xs text-slate-400 font-mono">Interactive stateful firewall matrix with real-time exposure heatmaps</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              showHeatmap
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Exposure Heatmap: {showHeatmap ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Grid Matrix Table */}
      <div className="surface-panel p-6 overflow-x-auto border-cyan-500/20 shadow-2xl">
        <div className="mb-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Click any cell to toggle firewall access rule. Permitting access triggers pre-flight Safe-Change verification.</span>
          <span className="text-cyan-400 font-semibold">{deptList.length}x{deptList.length} ROUTING MATRIX</span>
        </div>

        <table className="w-full text-center border-collapse text-xs select-none">
          <thead>
            <tr>
              <th className="p-3 text-left font-mono text-[10px] text-slate-400 uppercase tracking-widest bg-slate-950/80 rounded-tl-lg">SRC \ DST</th>
              {deptList.map((dst) => (
                <th
                  key={dst.id}
                  className={`p-3 font-mono font-bold text-xs transition-colors bg-slate-950/80 ${
                    hoveredCell?.dst === dst.id ? 'text-cyan-400 bg-cyan-950/40 shadow-inner' : 'text-slate-300'
                  }`}
                >
                  {dst.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deptList.map((src) => (
              <tr key={src.id}>
                <td className={`p-3 text-left font-mono font-bold text-xs transition-colors bg-slate-950/80 border-t border-slate-800/80 ${
                  hoveredCell?.src === src.id ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-300'
                }`}>
                  {src.id}
                </td>
                {deptList.map((dst) => {
                  const cellData = matrix?.[src.id]?.[dst.id];
                  const isIntra = src.id === dst.id;
                  const httpAllowed = cellData?.http?.allowed;
                  const icmpAllowed = cellData?.icmp?.allowed;
                  const dnsAllowed = cellData?.dns?.allowed;

                  let cellClass = 'bg-rose-950/30 border-rose-800/40 text-rose-300 hover:border-rose-400 hover:bg-rose-950/60';
                  let label = 'BLOCKED';

                  if (isIntra || (httpAllowed && icmpAllowed && dnsAllowed)) {
                    cellClass = 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/60';
                    label = 'ALLOWED';
                  } else if (httpAllowed || dnsAllowed) {
                    cellClass = 'bg-amber-950/30 border-amber-800/40 text-amber-300 hover:border-amber-400 hover:bg-amber-950/60';
                    label = 'WEB/DNS';
                  }

                  const isHovered = hoveredCell?.src === src.id || hoveredCell?.dst === dst.id;

                  return (
                    <td
                      key={dst.id}
                      onMouseEnter={() => setHoveredCell({ src: src.id, dst: dst.id })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => !isIntra && handleCellClick(src.id, dst.id, label === 'ALLOWED' ? 'permit' : 'deny')}
                      className={`p-3.5 border border-slate-800/80 transition-all duration-200 cursor-pointer ${cellClass} ${
                        isHovered ? 'brightness-125 scale-[1.02] z-10 relative shadow-lg' : ''
                      } ${showHeatmap && label === 'ALLOWED' ? 'ring-2 ring-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''}`}
                    >
                      <div className="font-mono font-bold text-[11px] tracking-wider">{label}</div>
                      <div className="text-[9px] opacity-75 font-mono mt-0.5">
                        {isIntra ? 'Intra-VLAN' : 'Click to Flip'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Advanced Rules Table */}
      <div className="surface-panel p-6 space-y-4 border-cyan-500/20 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Zap className="w-4 h-4 text-cyan-400" />
            Active Cisco IOS Access Control List Rules ({rules?.length || 0})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase bg-slate-950/60">
                <th className="py-3 px-3.5">Sequence</th>
                <th className="py-3 px-3.5">Source Subnet</th>
                <th className="py-3 px-3.5">Destination</th>
                <th className="py-3 px-3.5">Protocol</th>
                <th className="py-3 px-3.5">Enforcement</th>
                <th className="py-3 px-3.5">Description & Comment</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rules?.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-cyan-400">#{r.order || r.id}</td>
                  <td className="py-3 px-3.5 font-semibold text-slate-200">{r.srcDept}</td>
                  <td className="py-3 px-3.5 font-semibold text-slate-200">{r.dstDept}</td>
                  <td className="py-3 px-3.5 uppercase text-purple-300 font-bold">{r.service}</td>
                  <td className="py-3 px-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.action === 'permit' 
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                    }`}>
                      {r.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-400 truncate max-w-xs">{r.comment}</td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(r.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe-Change Flow Modal */}
      <SafeChangeModal
        isOpen={!!pendingSafeChange}
        changeParams={pendingSafeChange}
        onClose={() => setPendingSafeChange(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['policy-matrix'] });
          queryClient.invalidateQueries({ queryKey: ['rules'] });
        }}
      />
    </div>
  );
}
