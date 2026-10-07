import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { FolderLock, Lock, Unlock, ShieldAlert, ArrowRight, Send, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, previewDept } = useAuthStore();
  const navigate = useNavigate();
  const [selectedLockedRes, setSelectedLockedRes] = useState(null);
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const effectiveDept = previewDept || user?.department || 'IT';

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources', effectiveDept],
    queryFn: () => apiRequest('/api/resources')
  });

  const handleOpenResource = (resObj) => {
    if (resObj.accessible) {
      navigate(`/resources/${resObj.id}`);
    } else {
      setSelectedLockedRes(resObj);
    }
  };

  const handleSendAccessRequest = async () => {
    if (!requestReason || !requestReason.trim()) {
      toast.error('Please enter a justification reason');
      return;
    }

    try {
      setIsSubmittingReq(true);
      await apiRequest('/api/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          resourceId: selectedLockedRes.id,
          reason: requestReason
        })
      });
      toast.success('Access request submitted to SecOps admin');
      setSelectedLockedRes(null);
      setRequestReason('');
    } catch (err) {
      toast.error('Failed to submit request', { description: err.message });
    } finally {
      setIsSubmittingReq(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Active Department Summary */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-glowCyan">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Welcome, {user?.name || user?.email}</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400">
            Assigned Department: <span className="font-bold text-cyan-400">{effectiveDept}</span> | Role: <span className="font-mono text-purple-300">{user?.role}</span>
          </p>
        </div>

        {/* Department Info Badge */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block">ACTIVE DEPT</span>
            <span className="text-cyan-300 font-bold">{effectiveDept}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-500 block">FIREWALL POLICY</span>
            <span className="text-emerald-400 font-bold">STATEFUL ENFORCED</span>
          </div>
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <FolderLock className="w-4 h-4 text-cyan-400" /> Enterprise Network Portal Resources
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">Loading resource security matrix...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources?.map((resObj) => {
              const isLocked = !resObj.accessible;

              return (
                <div
                  key={resObj.id}
                  onClick={() => handleOpenResource(resObj)}
                  className={`glass-panel p-5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-4 ${
                    isLocked
                      ? 'border-rose-500/40 hover:border-rose-500 hover:shadow-glowRose'
                      : 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-glowCyan'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {resObj.ownerDepartment}
                      </span>
                      <h4 className="text-base font-bold text-slate-100 mt-2">{resObj.name}</h4>
                    </div>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isLocked ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {resObj.description}
                  </p>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                      resObj.sensitivity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      resObj.sensitivity === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-900 text-slate-400'
                    }`}>
                      {resObj.sensitivity.toUpperCase()} SENSITIVITY
                    </span>

                    <span className="flex items-center gap-1 text-cyan-400 font-medium">
                      {isLocked ? 'Request Access' : 'Open Resource'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Access Restricted Modal / Drawer */}
      {selectedLockedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 max-w-md w-full border-rose-500/50 shadow-glowRose space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Access Restricted</h3>
                <p className="text-xs text-slate-400">Firewall ACL Policy Enforcement</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-mono text-[10px] text-rose-400 uppercase">Reason:</span>
              <p className="font-mono leading-relaxed">{selectedLockedRes.reason}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Submit Access Request Justification</label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Explain business justification for temporary exception access..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSelectedLockedRes(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendAccessRequest}
                disabled={isSubmittingReq}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shadow-glowCyan cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
