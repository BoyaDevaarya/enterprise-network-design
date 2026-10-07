import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Network, Send, X, Activity, Server, Laptop, Cpu, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NetworkMap() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [simParams, setSimParams] = useState({ srcDept: 'Sales', dstDept: 'Servers', test: 'http' });
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hoveredDept, setHoveredDept] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['network'],
    queryFn: () => apiRequest('/api/network')
  });

  const handleRunSimulation = async () => {
    try {
      setIsSimulating(true);
      setSimResult(null);
      const res = await apiRequest('/api/simulate', {
        method: 'POST',
        body: JSON.stringify(simParams)
      });
      setSimResult(res);
      toast.info(`Simulation output: ${res.allowed ? 'PERMITTED' : 'BLOCKED'}`, {
        description: res.reason
      });
    } catch (err) {
      toast.error('Simulation error', { description: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
        <Activity className="w-4 h-4 animate-spin text-cyan-400" /> Loading network topology map...
      </div>
    );
  }

  const departments = data?.departments || [];

  return (
    <div className="space-y-6">
      {/* Header & Simulation Control Bar */}
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Interactive Enterprise Network Topology
          </h2>
          <p className="text-xs text-slate-400">Router-on-a-stick topology with dynamic dot1Q subinterfaces and stateful firewalling</p>
        </div>

        {/* Packet Simulator Form */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs">
          <span className="font-mono text-[10px] text-cyan-400 px-1 uppercase">Traffic Test:</span>
          <select
            value={simParams.srcDept}
            onChange={(e) => setSimParams({ ...simParams, srcDept: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                From: {d.name}
              </option>
            ))}
          </select>

          <select
            value={simParams.dstDept}
            onChange={(e) => setSimParams({ ...simParams, dstDept: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                To: {d.name}
              </option>
            ))}
          </select>

          <select
            value={simParams.test}
            onChange={(e) => setSimParams({ ...simParams, test: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
          >
            <option value="http">HTTP (tcp 80/443)</option>
            <option value="dns">DNS (udp 53)</option>
            <option value="ping">Ping (icmp)</option>
          </select>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors shadow-glowCyan cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Packet</span>
          </button>
        </div>
      </div>

      {/* SVG Topology Viewport */}
      <div className="glass-panel p-6 relative overflow-hidden min-h-[520px] flex items-center justify-center">
        <svg viewBox="0 0 1000 500" className="w-full h-full max-h-[550px] select-none">
          <defs>
            <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Top Level Connections */}
          {/* Internet -> Router R1-EDGE */}
          <line x1="500" y1="50" x2="500" y2="130" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 4" className="animate-pulse" />
          {/* Router -> CORE-SW */}
          <line x1="500" y1="130" x2="500" y2="230" stroke="#8b5cf6" strokeWidth="3" />

          {/* Access Switch Links */}
          <line x1="500" y1="230" x2="150" y2="340" stroke="#22d3ee" strokeWidth="1.5" />
          <line x1="500" y1="230" x2="290" y2="340" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="500" y1="230" x2="430" y2="340" stroke="#8b5cf6" strokeWidth="1.5" />
          <line x1="500" y1="230" x2="570" y2="340" stroke="#10b981" strokeWidth="1.5" />
          <line x1="500" y1="230" x2="710" y2="340" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="500" y1="230" x2="850" y2="340" stroke="#f43f5e" strokeWidth="1.5" />

          {/* Node 1: Internet */}
          <g transform="translate(500, 50)" className="cursor-pointer" onClick={() => setSelectedNode({ id: 'internet', name: 'ISP Gateway Router', ip: '203.0.113.1', type: 'Internet WAN' })}>
            <circle r="22" fill="#0a0e1a" stroke="#3b82f6" strokeWidth="2" filter="url(#glow)" />
            <Globe x="-10" y="-10" className="w-5 h-5 text-blue-400" />
            <text y="35" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">Internet Gateway</text>
          </g>

          {/* Node 2: R1-EDGE Router */}
          <g transform="translate(500, 130)" className="cursor-pointer" onClick={() => setSelectedNode({ id: 'r1-edge', name: 'R1-EDGE Core Router', ip: '203.0.113.2', type: 'Cisco 2911 Router', subinterfaces: 'Gi0/1.10 - Gi0/1.60' })}>
            <circle r="26" fill="#070b16" stroke="#8b5cf6" strokeWidth="3" filter="url(#glow)" />
            <Cpu x="-12" y="-12" className="w-6 h-6 text-purple-400" />
            <text y="42" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono">R1-EDGE Router</text>
          </g>

          {/* Node 3: CORE-SW Switch */}
          <g transform="translate(500, 230)" className="cursor-pointer" onClick={() => setSelectedNode({ id: 'core-sw', name: 'CORE-SW L2 Switch', type: 'Cisco 3560 Switch', vlans: 'VLAN 10,20,30,40,50,60' })}>
            <rect x="-30" y="-16" width="60" height="32" rx="6" fill="#0e1726" stroke="#22d3ee" strokeWidth="2" filter="url(#glow)" />
            <text x="0" y="4" textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">CORE-SW</text>
            <text y="32" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">Trunk Core Switch</text>
          </g>

          {/* Access Switches & Workstations per department */}
          {[
            { id: 'HR', x: 150, color: '#22d3ee', name: 'SW-HR' },
            { id: 'Finance', x: 290, color: '#3b82f6', name: 'SW-FINANCE' },
            { id: 'IT', x: 430, color: '#8b5cf6', name: 'SW-IT' },
            { id: 'Sales', x: 570, color: '#10b981', name: 'SW-SALES' },
            { id: 'Management', x: 710, color: '#f59e0b', name: 'SW-MGMT' },
            { id: 'Servers', x: 850, color: '#f43f5e', name: 'SW-SERVERS' }
          ].map((dept) => (
            <g
              key={dept.id}
              transform={`translate(${dept.x}, 340)`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredDept(dept.id)}
              onMouseLeave={() => setHoveredDept(null)}
              onClick={() => setSelectedNode({ id: `sw-${dept.id.toLowerCase()}`, name: dept.name, department: dept.id, type: 'Access Switch' })}
            >
              <rect x="-24" y="-14" width="48" height="28" rx="4" fill="#0a0e1a" stroke={dept.color} strokeWidth="2" />
              <text x="0" y="3" textAnchor="middle" fill={dept.color} fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">{dept.id}</text>
              <text y="28" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">{dept.name}</text>
            </g>
          ))}

          {/* Simulation Path Animation */}
          {simResult && (
            <g>
              <circle
                r="8"
                fill={simResult.allowed ? '#10b981' : '#f43f5e'}
                filter="url(#glow)"
                className="animate-ping"
                transform={simResult.allowed ? 'translate(850, 340)' : 'translate(500, 130)'}
              />
            </g>
          )}
        </svg>

        {/* Simulation Result Callout Banner */}
        {simResult && (
          <div className={`absolute bottom-4 left-6 right-6 p-4 rounded-xl border flex items-center justify-between backdrop-blur-md ${
            simResult.allowed ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              {simResult.allowed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <ShieldAlert className="w-6 h-6 text-rose-400" />}
              <div>
                <div className="font-bold text-xs uppercase tracking-wider">
                  {simResult.allowed ? 'TRAFFIC PERMITTED' : 'TRAFFIC BLOCKED AT R1-EDGE FIREWALL'}
                </div>
                <div className="text-xs font-mono mt-0.5">{simResult.reason}</div>
              </div>
            </div>
            <button onClick={() => setSimResult(null)} className="text-xs opacity-75 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Node Detail Drawer Modal */}
      {selectedNode && (
        <div className="glass-panel p-5 space-y-3 relative border-cyan-500/40">
          <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" /> Node Inspection: {selectedNode.name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">NODE ID</span>
              <span className="text-cyan-300 font-bold">{selectedNode.id}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">TYPE</span>
              <span className="text-slate-300">{selectedNode.type}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">IP ADDRESS</span>
              <span className="text-slate-300">{selectedNode.ip || 'DHCP Pool'}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">DEPARTMENT</span>
              <span className="text-purple-300 font-bold">{selectedNode.department || 'Infrastructure'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
