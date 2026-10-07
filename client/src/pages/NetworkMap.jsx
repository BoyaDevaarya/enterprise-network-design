import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Send, X, Activity, Server, Cpu, Globe, 
  ShieldAlert, CheckCircle2, ArrowRightLeft, Search, Filter,
  History, Settings, Eye, ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { toast } from 'sonner';

// Theme configuration matching the cyber-enterprise requirement
const THEME = {
  HR: { color: '#22d3ee', name: 'cyan' },
  Finance: { color: '#3b82f6', name: 'blue' },
  IT: { color: '#8b5cf6', name: 'violet' },
  Sales: { color: '#10b981', name: 'emerald' },
  Management: { color: '#f59e0b', name: 'amber' },
  Servers: { color: '#f43f5e', name: 'rose' },
  Core: { color: '#94a3b8', name: 'slate' },
  Router: { color: '#e2e8f0', name: 'slate-light' }
};

const NODES = [
  { id: 'HR', x: 150, y: 350, name: 'SW-HR', vlan: 'VLAN 10', subnet: '10.0.10.0/24' },
  { id: 'Finance', x: 290, y: 350, name: 'SW-FINANCE', vlan: 'VLAN 20', subnet: '10.0.20.0/24' },
  { id: 'IT', x: 430, y: 350, name: 'SW-IT', vlan: 'VLAN 30', subnet: '10.0.30.0/24' },
  { id: 'Sales', x: 570, y: 350, name: 'SW-SALES', vlan: 'VLAN 40', subnet: '10.0.40.0/24' },
  { id: 'Management', x: 710, y: 350, name: 'SW-MGMT', vlan: 'VLAN 50', subnet: '10.0.50.0/24' },
  { id: 'Servers', x: 850, y: 350, name: 'SW-SERVERS', vlan: 'VLAN 60', subnet: '10.0.60.0/24' }
];

export default function NetworkMap() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [simParams, setSimParams] = useState({ srcDept: 'Sales', dstDept: 'Servers', test: 'http' });
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState([]);

  // Mock Queries
  const { data: networkData, isLoading } = useQuery({
    queryKey: ['network'],
    queryFn: () => apiRequest('/api/network').catch(() => ({ departments: NODES }))
  });

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimResult(null);
    setLogs([]);
    
    // Simulate animated logs
    const addLog = (msg, delay) => setTimeout(() => {
      setLogs(prev => [...prev, { time: new Date().toISOString().substring(11, 23), msg }]);
    }, delay);

    addLog(`[TX] Initiating ${simParams.test.toUpperCase()} packet from ${simParams.srcDept}`, 100);
    addLog(`[FWD] Switching frame to CORE-SW via trunk interface`, 800);
    addLog(`[FWD] Routing packet to R1-EDGE for inter-VLAN routing`, 1500);
    addLog(`[ACL] Inspecting packet against stateful firewall rulebase`, 2200);

    try {
      const res = await apiRequest('/api/simulate', {
        method: 'POST',
        body: JSON.stringify(simParams)
      }).catch(() => {
        // Mock fallback if backend is down
        const isAllowed = !(simParams.srcDept === 'Sales' && simParams.test === 'ping');
        return { allowed: isAllowed, reason: isAllowed ? 'Default permit intra-org' : 'ACL Rule 405 Deny ICMP' };
      });
      
      setTimeout(() => {
        setSimResult(res);
        addLog(res.allowed ? `[PERMIT] ${res.reason} -> Forwarding to ${simParams.dstDept}` : `[DROP] ${res.reason}`, 3000);
        addLog(res.allowed ? `[RX] Packet delivered to ${simParams.dstDept} successfully.` : `[TIMEOUT] Packet dropped by firewall.`, 3800);
        setIsSimulating(false);
        toast.info(`Simulation ${res.allowed ? 'PERMITTED' : 'BLOCKED'}`, { description: res.reason });
      }, 3000);
      
    } catch (err) {
      setIsSimulating(false);
      toast.error('Simulation error', { description: err.message });
    }
  };

  const handleSwap = () => {
    setSimParams(prev => ({ ...prev, srcDept: prev.dstDept, dstDept: prev.srcDept }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] space-y-4 overflow-hidden bg-[#09090b] text-zinc-100 p-4 relative">
      
      {/* 1. KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        {[
          { label: 'Active VLANs', value: '12', color: 'text-blue-400' },
          { label: 'Live Sessions', value: '8,432', color: 'text-cyan-400' },
          { label: 'Packets Dropped', value: '1,042', color: 'text-rose-400' },
          { label: 'FW Policy Hits', value: '45.2k', color: 'text-violet-400' },
          { label: 'Core Health', value: '99.9%', color: 'text-emerald-400' }
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={i} className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-center backdrop-blur-md shadow-sm"
          >
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{kpi.label}</span>
            <span className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* 2. Traffic Test Control Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">Packet Trace</span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-3xl">
          <select value={simParams.srcDept} onChange={e => setSimParams({...simParams, srcDept: e.target.value})} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500">
            {NODES.map(d => <option key={d.id} value={d.id}>SRC: {d.name} ({d.vlan})</option>)}
          </select>

          <button onClick={handleSwap} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <select value={simParams.dstDept} onChange={e => setSimParams({...simParams, dstDept: e.target.value})} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500">
            {NODES.map(d => <option key={d.id} value={d.id}>DST: {d.name} ({d.vlan})</option>)}
          </select>

          <select value={simParams.test} onChange={e => setSimParams({...simParams, test: e.target.value})} className="w-32 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-blue-500">
            <option value="http">HTTP (80)</option>
            <option value="https">HTTPS (443)</option>
            <option value="ping">ICMP Ping</option>
            <option value="ssh">SSH (22)</option>
          </select>

          <button onClick={handleRunSimulation} disabled={isSimulating} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Send className="w-3.5 h-3.5" /> {isSimulating ? 'Tracing...' : 'Send Packet'}
          </button>
        </div>
      </div>

      {/* 3. Main Topology Canvas & Inspector */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        
        {/* SVG Canvas */}
        <div className="flex-1 bg-[#0a0a0c] border border-zinc-800/60 rounded-xl overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
          
          <svg viewBox="0 0 1000 450" className="w-full h-full">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Links */}
            <path d="M 500 60 L 500 130" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" fill="none" className="animate-[dash-flow_20s_linear_infinite]" />
            <path d="M 500 160 L 500 240" stroke="#94a3b8" strokeWidth="3" fill="none" />
            
            {NODES.map(node => (
              <path key={`link-${node.id}`} d={`M 500 270 Q 500 310 ${node.x} 320`} stroke={THEME[node.id].color} strokeWidth="2" fill="none" opacity="0.6" />
            ))}

            {/* Animation Trace Path */}
            {isSimulating && (
              <circle r="6" fill="#fff" filter="url(#glow)">
                <animateMotion 
                  path={`M ${NODES.find(n => n.id === simParams.srcDept).x} 320 Q 500 310 500 270 L 500 240 L 500 160`} 
                  dur="1.5s" fill="freeze" 
                />
              </circle>
            )}

            {/* Node: Internet */}
            <g transform="translate(500, 40)" className="cursor-pointer" onClick={() => setSelectedNode({ name: 'Internet Gateway', type: 'WAN Endpoint', ip: '203.0.113.1' })}>
              <rect x="-60" y="-18" width="120" height="36" rx="18" fill="#18181b" stroke="#3b82f6" strokeWidth="1" filter="url(#glow)"/>
              <Globe x="-45" y="-8" className="w-4 h-4 text-blue-400" />
              <text x="10" y="4" textAnchor="middle" fill="#f4f4f5" fontSize="11" fontWeight="500" fontFamily="Inter">Internet Gateway</text>
            </g>

            {/* Node: R1-EDGE */}
            <g transform="translate(500, 145)" className="cursor-pointer" onClick={() => setSelectedNode({ name: 'R1-EDGE Router', type: 'Cisco ISR 4331', ip: '10.0.0.1' })}>
              <rect x="-65" y="-20" width="130" height="40" rx="8" fill="#18181b" stroke="#e2e8f0" strokeWidth="2" filter="url(#glow)"/>
              <Cpu x="-50" y="-10" className="w-5 h-5 text-slate-300" />
              <text x="12" y="4" textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="bold" fontFamily="Inter">R1-EDGE Core</text>
            </g>

            {/* Node: CORE-SW */}
            <g transform="translate(500, 255)" className="cursor-pointer" onClick={() => setSelectedNode({ name: 'CORE-SW Switch', type: 'Cisco Nexus 9k', ip: '10.0.0.2' })}>
              <rect x="-70" y="-16" width="140" height="32" rx="4" fill="#18181b" stroke="#94a3b8" strokeWidth="2" filter="url(#glow)"/>
              <Server x="-55" y="-8" className="w-4 h-4 text-slate-400" />
              <text x="10" y="4" textAnchor="middle" fill="#f4f4f5" fontSize="11" fontWeight="bold" fontFamily="Inter">Trunk Core Switch</text>
            </g>

            {/* Department Nodes */}
            {NODES.map(node => (
              <g 
                key={node.id} transform={`translate(${node.x}, 350)`} 
                className="cursor-pointer transition-transform hover:scale-105"
                onMouseEnter={() => setHoveredNode(node)} onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode({ name: node.name, type: 'Access Switch', ip: node.subnet, vlan: node.vlan })}
              >
                <rect x="-40" y="-16" width="80" height="32" rx="6" fill="#18181b" stroke={THEME[node.id].color} strokeWidth="1.5" filter="url(#glow)"/>
                <text x="0" y="4" textAnchor="middle" fill={THEME[node.id].color} fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">{node.id}</text>
                
                {/* Dark Pill for Label underneath to prevent line collisions */}
                <rect x="-45" y="24" width="90" height="20" rx="10" fill="rgba(9,9,11,0.8)" />
                <text x="0" y="38" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="Inter">{node.name}</text>
              </g>
            ))}
          </svg>

          {/* Hover Glass Tooltip */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute pointer-events-none bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-3 rounded-lg shadow-xl font-mono text-xs z-10"
                style={{ left: `${(hoveredNode.x / 1000) * 100}%`, top: '75%', transform: 'translate(-50%, -100%)' }}
              >
                <div className="font-bold text-zinc-100 mb-2 border-b border-zinc-800 pb-1">{hoveredNode.name}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <span className="text-zinc-500">VLAN ID</span><span style={{ color: THEME[hoveredNode.id].color }}>{hoveredNode.vlan}</span>
                  <span className="text-zinc-500">Subnet</span><span className="text-zinc-300">{hoveredNode.subnet}</span>
                  <span className="text-zinc-500">Active</span><span className="text-emerald-400">Online</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Slide-in Inspector Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 shrink-0 bg-zinc-950/90 border border-zinc-800 rounded-xl backdrop-blur-xl flex flex-col shadow-2xl z-20"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-400" /> Inspector
                </h3>
                <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono mb-1">NODE NAME</div>
                  <div className="font-bold text-zinc-200">{selectedNode.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono mb-1">HARDWARE TYPE</div>
                  <div className="text-zinc-300">{selectedNode.type}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono mb-1">IP ADDRESS / SUBNET</div>
                  <div className="font-mono text-blue-400 bg-blue-950/30 px-2 py-1 rounded inline-block border border-blue-900/50">{selectedNode.ip}</div>
                </div>
                {selectedNode.vlan && (
                  <div>
                    <div className="text-[10px] text-zinc-500 font-mono mb-1">ASSIGNED VLAN</div>
                    <div className="font-mono text-zinc-300">{selectedNode.vlan}</div>
                  </div>
                )}
                <div className="pt-4 border-t border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-mono mb-2">RECENT FIREWALL EVENTS</div>
                  <div className="space-y-2">
                    <div className="flex justify-between bg-zinc-900 p-2 rounded border border-zinc-800">
                      <span className="text-zinc-400">TCP 443 Hit</span><span className="text-emerald-400">Permit</span>
                    </div>
                    <div className="flex justify-between bg-zinc-900 p-2 rounded border border-zinc-800">
                      <span className="text-zinc-400">ICMP Echo</span><span className="text-rose-400">Deny</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Live Packet Trace Log Drawer */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-0 flex flex-col h-40 shrink-0 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Live Event Trace Log</span>
          </div>
          {simResult && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${simResult.allowed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-rose-500/20 text-rose-300 border-rose-500/50'}`}>
              FINAL: {simResult.allowed ? 'DELIVERED' : 'BLOCKED'}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-[11px]">
          <AnimatePresence>
            {logs.length === 0 && !isSimulating && (
              <div className="text-zinc-600 text-center mt-4">Waiting for packet simulation trigger...</div>
            )}
            {logs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                <span className={log.msg.includes('DROP') || log.msg.includes('TIMEOUT') ? 'text-rose-400' : log.msg.includes('PERMIT') || log.msg.includes('RX') ? 'text-emerald-400' : 'text-zinc-300'}>
                  {log.msg}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
