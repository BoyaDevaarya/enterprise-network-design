import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Inbox, CheckCircle, XCircle, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import SafeChangeModal from '../components/SafeChangeModal';

export default function AccessRequests() {
  const queryClient = useQueryClient();
  const [pendingSafeChange, setPendingSafeChange] = useState(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => apiRequest('/api/admin/access-requests')
  });

  const handleApprove = async (reqObj) => {
    // Triggers Safe-Change flow prefilled with request params
    setPendingSafeChange({
      src: reqObj.userDepartment,
      dst: reqObj.targetDepartment,
      service: 'http',
      action: 'permit',
      requestId: reqObj.id
    });
  };

  const handleDeny = async (reqId) => {
    try {
      await apiRequest(`/api/admin/access-requests/${reqId}/deny`, { method: 'POST' });
      toast.info('Access request denied');
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    } catch (err) {
      toast.error('Failed to deny request', { description: err.message });
    }
  };

  if (isLoading) {
    return <div className="p-16 text-center text-slate-400 font-mono text-xs surface-panel border-cyan-500/20">Loading pending access requests queue...</div>;
  }

  const reqList = requests || [];

  return (
    <div className="space-y-6">
      <div className="surface-panel p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              SECOPS INBOX
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Inbox className="w-5 h-5 text-cyan-400" /> Access Request Inbox ({reqList.length})
          </h2>
          <p className="text-xs text-slate-400 font-mono">Review member access requests and initiate Safe-Change approval workflows</p>
        </div>
      </div>

      <div className="surface-panel p-6 overflow-x-auto border-cyan-500/20 shadow-2xl">
        {reqList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No pending access requests in queue.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase bg-slate-950/60">
                <th className="py-3 px-4">Requester User</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Justification Reason</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reqList.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{r.userName}</div>
                    <div className="text-[11px] text-slate-400">{r.userEmail} (<span className="text-cyan-400 font-semibold">{r.userDepartment}</span>)</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-cyan-300">{r.resourceName} (<span className="text-purple-300">{r.targetDepartment}</span>)</td>
                  <td className="py-3.5 px-4 text-slate-200 max-w-xs">{r.reason}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.status === 'APPROVED' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]' :
                      r.status === 'DENIED' ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]' :
                      'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(r)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          Approve (Safe-Change)
                        </button>
                        <button
                          onClick={() => handleDeny(r.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs transition-all cursor-pointer"
                        >
                          Deny
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Safe-Change Flow Modal */}
      <SafeChangeModal
        isOpen={!!pendingSafeChange}
        changeParams={pendingSafeChange}
        onClose={() => setPendingSafeChange(null)}
        onSuccess={async () => {
          if (pendingSafeChange?.requestId) {
            await apiRequest(`/api/admin/access-requests/${pendingSafeChange.requestId}/approve`, { method: 'POST' });
          }
          queryClient.invalidateQueries({ queryKey: ['access-requests'] });
          queryClient.invalidateQueries({ queryKey: ['policy-matrix'] });
        }}
      />
    </div>
  );
}
