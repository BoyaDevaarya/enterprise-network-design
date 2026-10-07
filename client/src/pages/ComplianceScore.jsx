import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, Zap } from 'lucide-react';

export default function ComplianceScore() {
  const navigate = useNavigate();
  const { data: scoreData, isLoading } = useQuery({
    queryKey: ['policy-score'],
    queryFn: () => apiRequest('/api/policy/score')
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Calculating security compliance grade...
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
      <div className="glass-panel p-5">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" /> Security Posture & Compliance Gauge
        </h2>
        <p className="text-xs text-slate-400">Automated assessment of firewall permit exposure and trust gap vulnerabilities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radial Gauge Card */}
        <div className="glass-panel p-8 flex flex-col items-center justify-center text-center space-y-4 border-cyan-500/30 shadow-glowCyan">
          <div className="relative w-44 h-44 flex items-center justify-center">
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
                  score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold font-mono text-slate-100">{score}</span>
              <span className="text-xs font-mono text-slate-400">OUT OF 100</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-200">
              Overall Security Grade: <span className="text-cyan-400 font-mono text-xl">{grade}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {score >= 80 ? 'Optimal firewall isolation state' : 'Requires policy tightening and risk mitigation'}
            </p>
          </div>
        </div>

        {/* Top 3 Risks Card */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Top Identified Exposure Risks
            </h3>

            {topRisks.length === 0 ? (
              <p className="text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800">
                ✓ No high or critical exposure permit rules detected. Network posture is secure.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {topRisks.map((riskMsg, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-slate-300 font-mono leading-relaxed">{riskMsg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/matrix')}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-glowCyan cursor-pointer mt-4"
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
