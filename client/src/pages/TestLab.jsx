import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { Terminal as TerminalIcon, Play, ShieldAlert, CheckCircle2, History, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function TestLab() {
  const [srcDept, setSrcDept] = useState('Sales');
  const [dstDept, setDstDept] = useState('Servers');
  const [test, setTest] = useState('http');
  const [simulation, setSimulation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiRequest('/api/network').then(res => res.departments)
  });

  const handleSimulate = async () => {
    try {
      setIsRunning(true);
      const res = await apiRequest('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({ srcDept, dstDept, test })
      });
      setSimulation(res);
      setHistory((prev) => [
        { time: new Date().toLocaleTimeString(), srcDept, dstDept, test, allowed: res.allowed, reason: res.reason },
        ...prev.slice(0, 9)
      ]);
    } catch (err) {
      setSimulation({ allowed: false, reason: err.message, output: 'Simulation Error' });
    } finally {
      setIsRunning(false);
    }
  };

  const deptList = departments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-cyan-400" /> Packet Tracer Traffic Simulation Terminal
        </h2>
        <p className="text-xs text-slate-400">Interactive packet generator & stateful ACL rule path tracer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls & History */}
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Simulation Target Parameters</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Source Subnet (Origin)</label>
                <select
                  value={srcDept}
                  onChange={(e) => setSrcDept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                >
                  {deptList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.subnet})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Destination Subnet (Target)</label>
                <select
                  value={dstDept}
                  onChange={(e) => setDstDept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                >
                  {deptList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.subnet})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Protocol / Service Test</label>
                <select
                  value={test}
                  onChange={(e) => setTest(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono"
                >
                  <option value="http">HTTP / HTTPS (tcp 80/443)</option>
                  <option value="dns">DNS Resolution (udp 53)</option>
                  <option value="ping">ICMP Echo Request (ping)</option>
                  <option value="tracert">Traceroute Diagnostics (icmp)</option>
                </select>
              </div>

              <button
                onClick={handleSimulate}
                disabled={isRunning}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-colors shadow-glowCyan cursor-pointer mt-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isRunning ? 'Tracing Packet...' : 'Run Simulation Trace'}</span>
              </button>
            </div>
          </div>

          {/* History Panel */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Recent Simulation History
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No previous traces recorded in session.</p>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                {history.map((h, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500">{h.time}</span>
                      <div className="text-slate-200 font-bold">{h.srcDept} → {h.dstDept} ({h.test})</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.allowed ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {h.allowed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Terminal Trace Output & Verdict Badge */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="ml-2">Cisco IOS Packet Tracer Output Console</span>
              </div>

              {simulation && (
                <div className={`px-3 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg animate-in fade-in zoom-in-95 ${
                  simulation.allowed ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-rose-950 text-rose-300 border border-rose-500'
                }`}>
                  {simulation.allowed ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>{simulation.allowed ? 'VERDICT: PERMITTED' : 'VERDICT: BLOCKED'}</span>
                </div>
              )}
            </div>

            {/* Terminal Window */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 min-h-[320px] overflow-auto shadow-inner leading-relaxed">
              {simulation ? (
                <pre className="whitespace-pre-wrap">{simulation.output}</pre>
              ) : (
                <div className="text-slate-600 flex flex-col items-center justify-center py-20">
                  <TerminalIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span>Select origin and target subnets above, then click "Run Simulation Trace".</span>
                </div>
              )}
            </div>

            {/* Mini Topology Path Trace */}
            {simulation?.path && (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Traversed Node Path:</span>
                <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono pt-1">
                  {simulation.path.map((node, i) => (
                    <React.Fragment key={node}>
                      <span className="px-2.5 py-1 rounded bg-slate-950 text-cyan-300 border border-slate-800 shrink-0">
                        {node}
                      </span>
                      {i < simulation.path.length - 1 && (
                        <span className="text-slate-600 font-bold">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
