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
      <div className="surface-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" /> Virtualized Audit Log Stream ({auditData?.total || 0})
          </h2>
          <p className="text-xs text-zinc-400">Complete immutable record of all logins, access attempts, and firewall changes</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, or reason..."
              className="bg-zinc-900 border border-zinc-700 rounded-sm pl-9 pr-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-2 text-zinc-200 font-mono"
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
      <div className="surface-panel p-6">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400 font-mono text-xs">Loading virtualized audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs">No matching audit logs found.</div>
        ) : (
          <div ref={parentRef} className="h-[600px] overflow-auto border border-zinc-800 rounded-sm">
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
                    className="border-b border-zinc-800/60 font-mono text-xs p-3 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                          className="text-zinc-500 hover:text-blue-500"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <span className="text-[10px] text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="font-bold text-zinc-200">{log.action}</span>
                        <span className="text-zinc-400 truncate max-w-xs">{log.userEmail}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-zinc-300 truncate max-w-sm text-[11px]">{log.reason}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.riskLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          log.riskLevel === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          log.riskLevel === 'MEDIUM' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {log.riskLevel || 'LOW'}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 p-3 bg-zinc-950 rounded-sm border border-zinc-800 text-[11px] space-y-2">
                        <div>
                          <span className="text-zinc-500">Details & Payload:</span>
                        </div>
                        <pre className="text-blue-400 overflow-x-auto p-2 bg-zinc-900 rounded">
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
