import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Inbox, CheckCircle, XCircle, Clock } from 'lucide-react';
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
    return <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading pending access requests...</div>;
  }

  const reqList = requests || [];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Inbox className="w-5 h-5 text-cyan-400" /> Access Request Inbox ({reqList.length})
        </h2>
        <p className="text-xs text-slate-400">Review member access requests for restricted resources</p>
      </div>

      <div className="glass-panel p-6 overflow-x-auto">
        {reqList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">No access requests pending.</div>
        ) : (
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Justification Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reqList.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-200">{r.userName}</div>
                    <div className="text-[11px] text-slate-400">{r.userEmail} ({r.userDepartment})</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-cyan-400">{r.resourceName} ({r.targetDepartment})</td>
                  <td className="py-3 px-4 text-slate-300">{r.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      r.status === 'DENIED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(r)}
                          className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glowCyan cursor-pointer"
                        >
                          Approve (Safe-Change)
                        </button>
                        <button
                          onClick={() => handleDeny(r.id)}
                          className="px-3 py-1.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs"
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
