import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, Zap, CheckCircle2, Shield, Lock, Radio } from 'lucide-react';

export default function ComplianceScore() {
  const navigate = useNavigate();
  const { data: scoreData, isLoading } = useQuery({
    queryKey: ['policy-score'],
    queryFn: () => apiRequest('/api/policy/score')
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-xs surface-panel border-cyan-500/20">
        Calculating security compliance grade & evaluating trust-gap vectors...
      </div>
    );
  }

  const score = scoreData?.score || 0;
  const grade = scoreData?.grade || 'F';
  const topRisks = scoreData?.topRisks || [];

  // Radial SVG math
  const strokeDashoffset = 283 - (283 * score) / 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="surface-panel p-6 border-cyan-500/30 shadow-glass">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            SECURITY AUDIT
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" /> Security Posture & Compliance Gauge
        </h2>
        <p className="text-xs text-slate-400 font-mono">Automated real-time assessment of firewall permit exposure and trust-gap vulnerabilities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radial Gauge Card */}
        <div className="surface-panel p-8 flex flex-col items-center justify-center text-center space-y-5 border-cyan-500/30 shadow-glass relative overflow-hidden bg-slate-950">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="text-slate-900 stroke-current"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className={`stroke-current transition-all duration-1000 ${
                  score >= 80 ? 'text-emerald-400 drop-shadow-[0_0_8px_#34d399]' : 
                  score >= 60 ? 'text-amber-400 drop-shadow-[0_0_8px_#fbbf24]' : 
                  'text-rose-400 drop-shadow-[0_0_8px_#fb7185]'
                }`}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black font-mono text-white tracking-tight">{score}</span>
              <span className="text-[10px] font-mono text-slate-400 tracking-widest mt-0.5">COMPLIANCE INDEX</span>
            </div>
          </div>

          <div>
            <div className="text-base font-bold text-slate-100 flex items-center justify-center gap-2">
              <span>Overall Posture Grade:</span>
              <span className={`font-mono text-2xl font-black px-2.5 py-0.5 rounded-md border ${
                score >= 80 ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                score >= 60 ? 'text-amber-300 bg-amber-950/80 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                'text-rose-300 bg-rose-950/80 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              }`}>
                {grade}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              {score >= 80 ? 'Optimal firewall isolation and minimal risk exposure state.' : 'Requires policy tightening and risk mitigation across subnets.'}
            </p>
          </div>
        </div>

        {/* Top Identified Risks Card */}
        <div className="surface-panel p-6 space-y-4 flex flex-col justify-between border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Top Identified Exposure Risks
              </h3>
              <span className="text-[10px] font-mono text-slate-500">{topRisks.length} Vectors</span>
            </div>

            {topRisks.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>No high or critical exposure permit rules detected. Network posture is secure.</span>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {topRisks.map((riskMsg, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-amber-500/30">
                      {i + 1}
                    </span>
                    <span className="text-slate-200 font-mono leading-relaxed">{riskMsg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/matrix')}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer mt-4"
          >
            <Zap className="w-4 h-4" />
            <span>Open Policy Matrix To Fix Risks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
