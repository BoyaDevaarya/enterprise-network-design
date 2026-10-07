import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { apiRequest } from '../services/api';
import { History, Search, Shield, ChevronDown, ChevronRight, Filter, AlertTriangle } from 'lucide-react';

export default function AuditLog() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs', search, riskFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (riskFilter) params.set('riskLevel', riskFilter);
      params.set('limit', '500');
      return apiRequest(`/api/admin/audit?${params.toString()}`);
    }
  });

  const logs = auditData?.data || [];

  const parentRef = useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 10
  });

  return (
    <div className="space-y-6">
      <div className="surface-panel p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              IMMUTABLE LEDGER
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" /> Virtualized Audit Log Stream ({auditData?.total || 0})
          </h2>
          <p className="text-xs text-slate-400 font-mono">Complete immutable record of all logins, access attempts, and firewall changes</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, or reason..."
              className="bg-slate-950 border border-slate-700 hover:border-cyan-500/40 focus:border-cyan-500 rounded-lg pl-10 pr-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono shadow-inner"
            />
          </div>

          <button
            onClick={async () => {
              try {
                const res = await apiRequest('/api/admin/audit/verify');
                if (res.tamperProof) {
                  toast.success('SHA-256 Chain Verified', { description: `Validated ${res.details?.count || 0} audit logs. Zero tamper events.` });
                } else {
                  toast.error('Cryptographic Chain Compromised!', { description: res.details?.reason });
                }
              } catch (err) {
                toast.error('Verification failed', { description: err.message });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900/80 text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            Verify SHA-256 Chain
          </button>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-cyan-500/40 focus:border-cyan-500 rounded-lg px-3.5 py-2 text-slate-200 font-mono outline-none cursor-pointer"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL RISK</option>
            <option value="HIGH">HIGH RISK</option>
            <option value="MEDIUM">MEDIUM RISK</option>
            <option value="LOW">LOW RISK</option>
          </select>
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="surface-panel p-6 border-cyan-500/20 shadow-2xl">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 font-mono text-xs">Loading virtualized immutable audit ledger...</div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-mono text-xs">No matching audit logs found.</div>
        ) : (
          <div ref={parentRef} className="h-[620px] overflow-auto border border-slate-800 rounded-lg bg-slate-950/80">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative'
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const log = logs[virtualRow.index];
                const isExpanded = expandedRow === log.id;

                return (
                  <div
                    key={log.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`
                    }}
                    className="border-b border-slate-800/80 font-mono text-xs p-3.5 hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                          className="text-slate-500 hover:text-cyan-400 p-1 rounded transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <span className="text-[10px] text-slate-500 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="font-bold text-slate-100">{log.action}</span>
                        <span className="text-slate-400 truncate max-w-xs">{log.userEmail}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 truncate max-w-sm text-[11px]">{log.reason}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.riskLevel === 'CRITICAL' ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
                          log.riskLevel === 'HIGH' ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                          log.riskLevel === 'MEDIUM' ? 'bg-blue-950/90 text-blue-300 border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {log.riskLevel || 'LOW'}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-2 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/90 p-2.5 rounded border border-slate-800">
                          <div>
                            <span className="text-slate-500 block">SHA-256 BLOCK HASH:</span>
                            <span className="text-emerald-400 font-bold break-all">{log.hash || 'GENESIS_HASH'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">PREVIOUS BLOCK HASH:</span>
                            <span className="text-cyan-400 font-bold break-all">{log.previousHash || 'GENESIS_BLOCK_000000000000'}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Change Diff & Event Payload:</span>
                          <span className="text-[10px] text-cyan-400">ID: {log.id}</span>
                        </div>
                        <pre className="text-cyan-300 overflow-x-auto p-3 bg-slate-900 rounded-lg border border-slate-800/80 leading-relaxed font-mono">
                          {JSON.stringify({ before: log.before, after: log.after, details: log.details || log.metadata }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
