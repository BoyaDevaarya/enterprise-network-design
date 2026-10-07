import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { apiRequest } from '../services/api';
import { History, Search, Shield, ChevronDown, ChevronRight } from 'lucide-react';

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
    estimateSize: () => 55,
    overscan: 10
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" /> Virtualized Audit Log Stream ({auditData?.total || 0})
          </h2>
          <p className="text-xs text-slate-400">Complete immutable record of all logins, access attempts, and firewall changes</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, or reason..."
              className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="glass-panel p-6">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading virtualized audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">No matching audit logs found.</div>
        ) : (
          <div ref={parentRef} className="h-[600px] overflow-auto border border-slate-800 rounded-xl">
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
                    className="border-b border-slate-800/60 font-mono text-xs p-3 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                          className="text-slate-500 hover:text-cyan-400"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="font-bold text-slate-200">{log.action}</span>
                        <span className="text-slate-400 truncate max-w-xs">{log.userEmail}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 truncate max-w-sm text-[11px]">{log.reason}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.riskLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          log.riskLevel === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          log.riskLevel === 'MEDIUM' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {log.riskLevel || 'LOW'}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-2">
                        <div>
                          <span className="text-slate-500">Details & Payload:</span>
                        </div>
                        <pre className="text-cyan-300 overflow-x-auto p-2 bg-slate-900 rounded">
                          {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
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
