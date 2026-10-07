import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, ArrowRight, Clock, X, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../services/api';

export default function SafeChangeModal({ isOpen, changeParams, onClose, onSuccess }) {
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [reason, setReason] = useState('');
  const [typedPhrase, setTypedPhrase] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [holdTimer, setHoldTimer] = useState(null);

  useEffect(() => {
    if (isOpen && changeParams) {
      fetchPreview();
    } else {
      setPreviewData(null);
      setReason('');
      setTypedPhrase('');
      setHoldProgress(0);
    }
  }, [isOpen, changeParams]);

  const fetchPreview = async () => {
    try {
      setIsLoadingPreview(true);
      const data = await apiRequest('/api/admin/changes/preview', {
        method: 'POST',
        body: JSON.stringify({
          src: changeParams.src,
          dst: changeParams.dst,
          service: changeParams.service || 'any',
          action: changeParams.action || 'permit',
          expiresInMinutes: changeParams.expiresInMinutes
        })
      });
      setPreviewData(data);
    } catch (err) {
      toast.error('Failed to load risk preview', { description: err.message });
      onClose();
    } finally {
      setIsLoadingPreview(false);
    }
  };

  if (!isOpen || !changeParams) return null;

  const risk = previewData?.risk || {};
  const isHighOrCritical = risk.level === 'HIGH' || risk.level === 'CRITICAL';
  const isCritical = risk.level === 'CRITICAL';

  const isReasonValid = !risk.requiresReason || (reason && reason.trim().length >= 8);
  const isPhraseValid = !risk.requiresPhrase || (typedPhrase && typedPhrase.trim().toUpperCase() === risk.phrase);
  const canConfirm = isReasonValid && isPhraseValid && !isSubmitting;

  const handleApply = async () => {
    try {
      setIsSubmitting(true);
      const res = await apiRequest('/api/admin/changes/apply', {
        method: 'POST',
        body: JSON.stringify({
          src: changeParams.src,
          dst: changeParams.dst,
          service: changeParams.service || 'any',
          action: changeParams.action || 'permit',
          expiresInMinutes: changeParams.expiresInMinutes,
          reason,
          phrase: typedPhrase
        })
      });

      const changeId = res.changeId;

      toast.success('Policy change applied successfully', {
        description: 'New ACL rules enforced across firewall',
        duration: 10000,
        action: {
          label: 'UNDO (10s)',
          onClick: async () => {
            try {
              await apiRequest(`/api/admin/changes/undo/${changeId}`, { method: 'POST' });
              toast.info('Policy change undone successfully');
              if (onSuccess) onSuccess();
            } catch (err) {
              toast.error('Undo failed', { description: err.message });
            }
          }
        }
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err.status === 422) {
        toast.error('Validation Rejected', { description: err.message });
      } else {
        toast.error('Apply Failed', { description: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3-second hold to confirm for CRITICAL risk
  const startHold = () => {
    if (!canConfirm || !isCritical) return;
    let start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(pct);
      if (elapsed >= 3000) {
        clearInterval(interval);
        handleApply();
      }
    }, 50);
    setHoldTimer(interval);
  };

  const cancelHold = () => {
    if (holdTimer) {
      clearInterval(holdTimer);
      setHoldTimer(null);
    }
    setHoldProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl surface-panel border-cyan-500/30 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 my-8 bg-slate-900/95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">Review Safe-Change Request</h2>
            <p className="text-xs text-slate-400 font-mono">Pre-flight risk assessment and dynamic policy impact verification</p>
          </div>
        </div>

        {isLoadingPreview ? (
          <div className="py-14 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-cyan-400" />
            Analyzing network topology impact and running server-side security checks...
          </div>
        ) : (
          <div className="space-y-5 text-xs font-mono">
            {/* 1. Link Visual: Broken to Connected */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                  {changeParams.src}
                </span>
                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] text-slate-400 mb-1">{changeParams.service?.toUpperCase() || 'ANY'} PROTOCOL</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-rose-500 line-through" />
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="w-3 h-0.5 bg-emerald-500" />
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                  {changeParams.dst}
                </span>
              </div>

              {/* Animated Risk Badge */}
              <div className={`px-3 py-1.5 rounded-full font-bold tracking-wider flex items-center gap-2 border ${
                risk.level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]' :
                risk.level === 'HIGH' ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]' :
                risk.level === 'MEDIUM' ? 'bg-blue-950 text-blue-300 border-blue-500' :
                'bg-emerald-950 text-emerald-300 border-emerald-500'
              }`}>
                <span>{risk.level} RISK</span>
                <span className="text-xs">({risk.score}/100)</span>
              </div>
            </div>

            {/* Warning Banner for HIGH / CRITICAL */}
            {isHighOrCritical && (
              <div className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                isCritical ? 'bg-rose-950/50 border-rose-500/60 text-rose-200' : 'bg-amber-950/50 border-amber-500/60 text-amber-200'
              }`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider mb-1">
                    {isCritical ? 'CRITICAL SECURITY OVERRIDE WARNING' : 'HIGH RISK EXPOSURE WARNING'}
                  </h4>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    This action widens firewall permissions between {changeParams.src} and {changeParams.dst}. All access attempts will be audited permanently in the immutable ledger.
                  </p>
                </div>
              </div>
            )}

            {/* Server Reasons */}
            <div className="space-y-1 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Risk Factor Analysis:</span>
              <ul className="space-y-1 list-disc list-inside text-slate-300 pt-1">
                {risk.reasons?.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Impacted Users & ACL Diff */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Impacted Entities:</span>
                <div className="mt-1 text-slate-200 font-bold">
                  {previewData?.impactedUsers?.length || 0} Users & {previewData?.impactedResources?.length || 0} Resources reachable
                </div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">ACL Line Diff:</span>
                <pre className="mt-1 text-[10px] font-mono text-emerald-400 overflow-x-auto">
                  {previewData?.aclDiff ? previewData.aclDiff.split('\n').slice(0, 3).join('\n') : '+ permit ip ...'}
                </pre>
              </div>
            </div>

            {/* Required Justification Reason */}
            {risk.requiresReason && (
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Justification Reason <span className="text-rose-400">* (Min 8 characters required)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Authorized emergency audit access approved by SecOps"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Required Confirmation Phrase for CRITICAL */}
            {risk.requiresPhrase && (
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Type Confirmation Phrase: <span className="text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold">{risk.phrase}</span>
                </label>
                <input
                  type="text"
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  placeholder={risk.phrase}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {isCritical ? (
                <button
                  type="button"
                  onMouseDown={startHold}
                  onMouseUp={cancelHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={startHold}
                  onTouchEnd={cancelHold}
                  disabled={!canConfirm}
                  className={`relative overflow-hidden px-6 py-2.5 rounded-lg font-bold transition-all shadow-md select-none ${
                    canConfirm
                      ? 'bg-rose-600 text-white hover:bg-rose-500 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {holdProgress > 0 ? `HOLD FOR 3s (${Math.round(holdProgress)}%)` : 'PRESS & HOLD 3s TO APPLY'}
                  </span>
                  <div
                    className="absolute inset-0 bg-rose-400/50 transition-all duration-75"
                    style={{ width: `${holdProgress}%` }}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!canConfirm}
                  className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                    canConfirm
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  Confirm & Enforce Rule
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
