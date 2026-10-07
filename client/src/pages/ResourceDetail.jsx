import React from 'react';
import { useParams, useNavigate } from 'react'
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, ArrowLeft, Table, Database, CheckCircle } from 'lucide-react';

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { previewDept, user } = useAuthStore();
  const effectiveDept = previewDept || user?.department || 'IT';

  const { data: resContent, isLoading, error } = useQuery({
    queryKey: ['resource-content', id, effectiveDept],
    queryFn: () => apiRequest(`/api/resources/${id}/content`),
    retry: false
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Connecting to resource host and performing stateful ACL evaluation...
      </div>
    );
  }

  // Handle Access Denied (403)
  if (error) {
    const isForbidden = error.status === 403 || error.code === 'FORBIDDEN';
    return (
      <div className="max-w-2xl mx-auto my-12 glass-panel p-8 border-rose-500/60 shadow-glowRose text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-100">403 Access Forbidden</h2>
          <p className="text-xs text-slate-400 mt-1">EnterpriseNet Gateway Security Enforcement</p>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-left font-mono text-xs space-y-2">
          <span className="text-rose-400 font-bold uppercase text-[10px]">MATCHED ACL RULE REASON:</span>
          <p className="text-slate-200">{error.message || 'Access denied by active firewall rule'}</p>
          {error.matchedRuleId && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Matched Rule ID: <span className="text-cyan-400">{error.matchedRuleId}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/resources')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Resources
        </button>
      </div>
    );
  }

  const content = resContent?.content || {};
  const tableData = content.table || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/resources')}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resources Portal
      </button>

      {/* Resource Banner */}
      <div className="glass-panel p-6 border-emerald-500/40 shadow-glowCyan space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{resContent.name}</h2>
              <p className="text-xs text-slate-400">{resContent.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-400 font-mono">
            <CheckCircle className="w-4 h-4" />
            <span>ACCESS GRANTED ({effectiveDept})</span>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" /> {content.title || 'Database Records'}
        </h3>

        {tableData.length === 0 ? (
          <p className="text-xs text-slate-400">No tabular data records available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  {Object.keys(tableData[0]).map((key) => (
                    <th key={key} className="py-3 px-4 font-semibold">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 text-slate-200 transition-colors">
                    {Object.values(row).map((val, vIdx) => (
                      <td key={vIdx} className="py-3 px-4">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
