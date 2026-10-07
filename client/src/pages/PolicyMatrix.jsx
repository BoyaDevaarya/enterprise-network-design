import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Grid, Flame, Plus, Trash2, CheckCircle2, ShieldAlert, AlertTriangle, Undo, Lock, Unlock } from 'lucide-react';
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

      toast.success(`Matrix updated: ${src} -> ${dst} (${action.toUpperCase()})`, {
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
      toast.success('Rule deleted');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['policy-matrix'] });
    } catch (err) {
      toast.error('Failed to delete rule', { description: err.message });
    }
  };

  if (loadingMatrix || loadingRules) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Calculating live firewall matrix state...
      </div>
    );
  }

  const deptList = departments || [];

  return (
    <div className="space-y-6">
      {/* Top Controls & Exposure Heatmap Toggle */}
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" /> Policy Matrix 2.0 Control Center
          </h2>
          <p className="text-xs text-slate-400">Interactive firewall policy matrix with real-time exposure heatmaps</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showHeatmap
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-glowAmber'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Exposure Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Grid Matrix Table */}
      <div className="glass-panel p-6 overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs select-none">
          <thead>
            <tr>
              <th className="p-3 text-left font-mono text-[10px] text-slate-500 uppercase">SRC \ DST</th>
              {deptList.map((dst) => (
                <th
                  key={dst.id}
                  className={`p-3 font-mono font-bold text-xs transition-colors ${
                    hoveredCell?.dst === dst.id ? 'text-cyan-400 bg-cyan-950/30' : 'text-slate-300'
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
                <td className={`p-3 text-left font-mono font-bold text-xs transition-colors ${
                  hoveredCell?.src === src.id ? 'text-cyan-400 bg-cyan-950/30' : 'text-slate-300'
                }`}>
                  {src.id}
                </td>
                {deptList.map((dst) => {
                  const cellData = matrix?.[src.id]?.[dst.id];
                  const isIntra = src.id === dst.id;
                  const httpAllowed = cellData?.http?.allowed;
                  const icmpAllowed = cellData?.icmp?.allowed;
                  const dnsAllowed = cellData?.dns?.allowed;

                  let cellClass = 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:border-rose-400';
                  let label = 'BLOCKED';

                  if (isIntra || (httpAllowed && icmpAllowed && dnsAllowed)) {
                    cellClass = 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:border-emerald-400';
                    label = 'ALLOWED';
                  } else if (httpAllowed || dnsAllowed) {
                    cellClass = 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:border-amber-400';
                    label = 'WEB/DNS';
                  }

                  const isHovered = hoveredCell?.src === src.id || hoveredCell?.dst === dst.id;

                  return (
                    <td
                      key={dst.id}
                      onMouseEnter={() => setHoveredCell({ src: src.id, dst: dst.id })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => !isIntra && handleCellClick(src.id, dst.id, label === 'ALLOWED' ? 'permit' : 'deny')}
                      className={`p-3 border transition-all cursor-pointer ${cellClass} ${
                        isHovered ? 'brightness-125 scale-[1.03]' : ''
                      } ${showHeatmap && label === 'ALLOWED' ? 'ring-2 ring-rose-500/50' : ''}`}
                    >
                      <div className="font-mono font-bold text-[11px]">{label}</div>
                      <div className="text-[9px] opacity-75 mt-0.5">
                        {isIntra ? 'Intra-Dept' : 'Click Flip'}
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
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>Advanced ACL Rules Table ({rules?.length || 0})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Comment</th>
                <th className="py-2.5 px-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rules?.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">#{r.order || r.id}</td>
                  <td className="py-2.5 px-3">{r.srcDept}</td>
                  <td className="py-2.5 px-3">{r.dstDept}</td>
                  <td className="py-2.5 px-3 uppercase text-purple-300">{r.service}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.action === 'permit' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {r.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{r.comment}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteRule(r.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
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
