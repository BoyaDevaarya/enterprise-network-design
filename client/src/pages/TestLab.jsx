import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { Terminal as TerminalIcon, Play, ShieldAlert, CheckCircle2, History, RotateCcw, Zap, Radio, Layers } from 'lucide-react';
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
      <div className="surface-panel p-6 border-cyan-500/30 shadow-glass">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            TRAFFIC GENERATOR
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-cyan-400" /> Packet Tracer Traffic Simulation Terminal
        </h2>
        <p className="text-xs text-slate-400 font-mono">Interactive synthetic packet generator & Cisco IOS stateful rule path tracer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls & History */}
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="surface-panel p-5 space-y-4 border-cyan-500/20 shadow-xl">
            <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" /> Simulation Parameters
            </h3>

            <div className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">Origin Subnet (Source)</label>
                <select
                  value={srcDept}
                  onChange={(e) => setSrcDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500/40 focus:border-cyan-500 rounded-lg p-2.5 text-cyan-300 outline-none cursor-pointer"
                >
                  {deptList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.subnet})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">Target Subnet (Destination)</label>
                <select
                  value={dstDept}
                  onChange={(e) => setDstDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500/40 focus:border-cyan-500 rounded-lg p-2.5 text-cyan-300 outline-none cursor-pointer"
                >
                  {deptList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.subnet})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">Protocol / Service Test</label>
                <select
                  value={test}
                  onChange={(e) => setTest(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500/40 focus:border-cyan-500 rounded-lg p-2.5 text-slate-200 outline-none cursor-pointer font-mono"
                >
                  <option value="http">HTTP / HTTPS (tcp 80/443)</option>
                  <option value="dns">DNS Resolution (udp 53)</option>
                  <option value="ping">ICMP Echo Request (ping)</option>
                  <option value="tracert">Traceroute Diagnostics (icmp)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSimulate}
                disabled={isRunning}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.55)] cursor-pointer mt-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isRunning ? 'Injecting Synthetic Packets...' : 'Execute Simulation Trace'}</span>
              </button>
            </div>
          </div>

          {/* History Panel */}
          <div className="surface-panel p-5 space-y-3 border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-cyan-400" /> Recent Trace History
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic font-mono py-2">No previous traces recorded in session.</p>
            ) : (
              <div className="space-y-2 text-xs font-mono max-h-60 overflow-y-auto pr-1">
                {history.map((h, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">{h.time}</span>
                      <div className="text-slate-200 font-bold text-[11px]">{h.srcDept} → {h.dstDept} ({h.test})</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      h.allowed 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
                        : 'bg-rose-950 text-rose-300 border-rose-500/40'
                    }`}>
                      {h.allowed ? 'PASS' : 'BLOCKED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Terminal Trace Output & Verdict Badge */}
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-panel p-6 space-y-4 border-cyan-500/30 shadow-2xl relative overflow-hidden bg-slate-950">
            {/* Top Chrome */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_#f43f5e]" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_#f59e0b]" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
                <span className="ml-2 font-bold text-slate-200">Cisco IOS Packet Tracer Output Console</span>
              </div>

              {simulation && (
                <div className={`px-3 py-1 rounded-full font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg animate-in fade-in zoom-in-95 border ${
                  simulation.allowed 
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]' 
                    : 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                }`}>
                  {simulation.allowed ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>{simulation.allowed ? 'VERDICT: PERMITTED' : 'VERDICT: BLOCKED'}</span>
                </div>
              )}
            </div>

            {/* Terminal Window with Phosphor Glow */}
            <div className="bg-slate-950 p-5 rounded-lg border border-slate-800/90 font-mono text-xs text-emerald-400 min-h-[340px] overflow-auto shadow-inner leading-relaxed relative">
              <div className="scanline-overlay absolute inset-0 pointer-events-none opacity-20" />
              {simulation ? (
                <pre className="whitespace-pre-wrap relative z-10">{simulation.output}</pre>
              ) : (
                <div className="text-slate-600 flex flex-col items-center justify-center py-24 relative z-10">
                  <TerminalIcon className="w-10 h-10 mb-3 opacity-40 text-cyan-400 animate-pulse" />
                  <span className="font-semibold text-slate-400">Ready for synthetic packet injection.</span>
                  <span className="text-[11px] text-slate-600 mt-1">Select origin and target subnets on the left, then click "Execute Simulation Trace".</span>
                </div>
              )}
            </div>

            {/* Mini Topology Path Trace */}
            {simulation?.path && (
              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Traversed Node Path:</span>
                <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1">
                  {simulation.path.map((node, i) => (
                    <React.Fragment key={node}>
                      <span className="px-3 py-1 rounded-md bg-slate-950 text-cyan-300 border border-cyan-500/30 shrink-0 shadow-sm font-bold">
                        {node}
                      </span>
                      {i < simulation.path.length - 1 && (
                        <span className="text-slate-500 font-bold">→</span>
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
