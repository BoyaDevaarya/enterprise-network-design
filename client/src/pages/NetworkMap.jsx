import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Send, X, Activity, Server, Cpu, Globe, 
  ShieldAlert, CheckCircle2, ArrowRightLeft, Search, Filter,
  History, Settings, Eye, ChevronRight, Zap, Shield, Radio
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { toast } from 'sonner';

const THEME = {
  HR: { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', name: 'cyan' },
  Finance: { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', name: 'blue' },
  IT: { color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', name: 'violet' },
  Sales: { color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', name: 'emerald' },
  Management: { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', name: 'amber' },
  Servers: { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', name: 'rose' }
};

const NODES = [
  { id: 'HR', x: 150, y: 350, name: 'SW-HR', vlan: 'VLAN 10', subnet: '10.0.10.0/24', load: '12%', status: 'OPTIMAL' },
  { id: 'Finance', x: 290, y: 350, name: 'SW-FINANCE', vlan: 'VLAN 20', subnet: '10.0.20.0/24', load: '45%', status: 'OPTIMAL' },
  { id: 'IT', x: 430, y: 350, name: 'SW-IT', vlan: 'VLAN 30', subnet: '10.0.30.0/24', load: '88%', status: 'HIGH-LOAD' },
  { id: 'Sales', x: 570, y: 350, name: 'SW-SALES', vlan: 'VLAN 40', subnet: '10.0.40.0/24', load: '32%', status: 'OPTIMAL' },
  { id: 'Management', x: 710, y: 350, name: 'SW-MGMT', vlan: 'VLAN 50', subnet: '10.0.50.0/24', load: '8%', status: 'OPTIMAL' },
  { id: 'Servers', x: 850, y: 350, name: 'SW-SERVERS', vlan: 'VLAN 60', subnet: '10.0.60.0/24', load: '94%', status: 'HIGH-LOAD' }
];

export default function NetworkMap() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [simParams, setSimParams] = useState({ srcDept: 'Sales', dstDept: 'Servers', test: 'http' });
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { data: networkData } = useQuery({
    queryKey: ['network'],
    queryFn: () => apiRequest('/api/network').catch(() => ({ departments: NODES }))
  });

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimResult(null);
    setLogs([]);
    
    const addLog = (msg, delay) => setTimeout(() => {
      setLogs(prev => [...prev, { time: new Date().toISOString().substring(11, 23), msg }]);
    }, delay);

    addLog(`[TX] Initiating ${simParams.test.toUpperCase()} packet from ${simParams.srcDept}`, 100);
    addLog(`[FWD] Switching frame to CORE-SW via 802.1Q trunk`, 800);
    addLog(`[FWD] Routing packet to R1-EDGE for inter-VLAN inspection`, 1500);
    addLog(`[ACL] Inspecting payload against L7 stateful firewall rulebase`, 2200);

    try {
      const res = await apiRequest('/api/simulate', {
        method: 'POST',
        body: JSON.stringify(simParams)
      }).catch(() => {
        const isAllowed = !(simParams.srcDept === 'Sales' && simParams.test === 'ping');
        return { allowed: isAllowed, reason: isAllowed ? 'Default permit intra-org' : 'ACL Rule 405 Deny ICMP' };
      });
      
      setTimeout(() => {
        setSimResult(res);
        addLog(res.allowed ? `[PERMIT] ${res.reason} → Forwarding to ${simParams.dstDept}` : `[DROP] ${res.reason}`, 3000);
        addLog(res.allowed ? `[RX] Packet delivered to ${simParams.dstDept} successfully.` : `[TIMEOUT] Packet dropped by firewall.`, 3800);
        setIsSimulating(false);
        toast.info(`Simulation ${res.allowed ? 'PERMITTED' : 'BLOCKED'}`, { description: res.reason });
      }, 3000);
      
    } catch (err) {
      setIsSimulating(false);
      toast.error('Simulation error', { description: err.message });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-4 overflow-hidden text-slate-100 relative font-sans">
      
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 shrink-0">
        {[
          { label: 'Active VLANs', value: '12', sub: 'Isolated', color: 'text-cyan-400', glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] border-cyan-500/20' },
          { label: 'Live Sessions', value: '8,432', sub: 'Stateful', color: 'text-blue-400', glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] border-blue-500/20' },
          { label: 'Packets Blocked', value: '1,042', sub: 'Threats', color: 'text-rose-400', glow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.25)] border-rose-500/20' },
          { label: 'FW Policy Hits', value: '45.2k', sub: 'Evaluated', color: 'text-purple-400', glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] border-purple-500/20' },
          { label: 'Core Health', value: '99.9%', sub: 'Zero Packet Loss', color: 'text-emerald-400', glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] border-emerald-500/20' }
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: -15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.08, type: 'spring' }}
            key={i} 
            className={`surface-panel p-3.5 flex flex-col justify-between transition-all duration-300 ${kpi.glow}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{kpi.label}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</span>
              <span className="text-[9px] font-mono text-slate-500">{kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Traffic Test Control Bar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="surface-panel p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 border-cyan-500/30 shadow-glass"
      >
        <div className="flex items-center gap-2.5 px-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Packet Trace Injector</span>
        </div>

        <div className="flex items-center gap-2.5 flex-1 max-w-3xl">
          <select 
            value={simParams.srcDept} 
            onChange={e => setSimParams({...simParams, srcDept: e.target.value})} 
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer"
          >
            {NODES.map(d => <option key={d.id} value={d.id}>SRC: {d.name} ({d.id})</option>)}
          </select>

          <button 
            type="button"
            onClick={() => setSimParams(p => ({ ...p, srcDept: p.dstDept, dstDept: p.srcDept }))} 
            title="Swap Source and Destination"
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <select 
            value={simParams.dstDept} 
            onChange={e => setSimParams({...simParams, dstDept: e.target.value})} 
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer"
          >
            {NODES.map(d => <option key={d.id} value={d.id}>DST: {d.name} ({d.id})</option>)}
          </select>

          <select 
            value={simParams.test} 
            onChange={e => setSimParams({...simParams, test: e.target.value})} 
            className="w-36 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer"
          >
            <option value="http">HTTP (80)</option>
            <option value="https">HTTPS (443)</option>
            <option value="ping">ICMP Echo</option>
            <option value="ssh">SSH (22)</option>
          </select>

          <button 
            type="button"
            onClick={handleRunSimulation} 
            disabled={isSimulating} 
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> 
            <span>{isSimulating ? 'Injecting...' : 'Transmit'}</span>
          </button>
        </div>
      </motion.div>

      {/* Main Topology Canvas & Inspector */}
      <div className="flex-1 flex gap-4 overflow-hidden relative min-h-[340px]">
        
        {/* SVG Canvas */}
        <div 
          className="flex-1 surface-panel overflow-hidden relative shadow-2xl border-cyan-500/20 bg-slate-950/90"
          onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] bg-[size:35px_35px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />
          
          <svg viewBox="0 0 1000 450" className="w-full h-full drop-shadow-2xl">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-intense" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Static Backbone Links */}
            <path d="M 500 60 L 500 130" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="5 5" fill="none" className="animate-[dash-flow_10s_linear_infinite]" />
            <path d="M 500 160 L 500 240" stroke="#3b82f6" strokeWidth="3.5" fill="none" opacity="0.8" />
            
            {/* Ambient Traffic & Links */}
            {NODES.map((node, i) => (
              <g key={`link-group-${node.id}`}>
                <path d={`M 500 270 Q 500 310 ${node.x} 320`} stroke={THEME[node.id].color} strokeWidth="1.8" fill="none" opacity="0.35" />
                
                {/* Outbound ambient particle */}
                <circle r="2.5" fill={THEME[node.id].color} filter="url(#glow)">
                  <animateMotion path={`M 500 240 L 500 270 Q 500 310 ${node.x} 320`} dur={`${3 + (i * 0.4)}s`} repeatCount="indefinite" />
                </circle>
                
                {/* Inbound ambient particle */}
                <circle r="2" fill="#fff" opacity="0.7">
                  <animateMotion path={`M ${node.x} 320 Q 500 310 500 270 L 500 240`} dur={`${2.5 + (i * 0.3)}s`} repeatCount="indefinite" />
                </circle>
              </g>
            ))}

            {/* Simulation Trace Path */}
            {isSimulating && (
              <circle r="8" fill="#22d3ee" filter="url(#glow-intense)">
                <animateMotion 
                  path={`M ${NODES.find(n => n.id === simParams.srcDept)?.x || 570} 320 Q 500 310 500 270 L 500 240 L 500 160`} 
                  dur="1.5s" fill="freeze" 
                />
              </circle>
            )}

            {/* Hardware Render: Internet Gateway */}
            <g transform="translate(500, 40)" className="cursor-pointer transition-transform hover:scale-105" onClick={() => setSelectedNode({ name: 'Internet Gateway', type: 'WAN Edge Border Router', ip: '203.0.113.1', vlan: 'VLAN 100', load: '18%' })}>
              <rect x="-65" y="-18" width="130" height="36" rx="6" fill="#090d1a" stroke="#06b6d4" strokeWidth="1.5" filter="url(#glow)"/>
              <Globe x="-50" y="-8" className="w-4 h-4 text-cyan-400" />
              <text x="12" y="4" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700" fontFamily="Inter">Internet Gateway</text>
            </g>

            {/* Hardware Render: R1-EDGE Router */}
            <g transform="translate(500, 145)" className="cursor-pointer transition-transform hover:scale-105" onClick={() => setSelectedNode({ name: 'R1-EDGE Router', type: 'Cisco ISR 4331 Firewall / Router', ip: '10.0.0.1', vlan: 'Trunk 802.1Q', load: '42%' })}>
              <rect x="-70" y="-20" width="140" height="40" rx="6" fill="#0a1128" stroke="#38bdf8" strokeWidth="1.5" filter="url(#glow)"/>
              <rect x="-70" y="-20" width="8" height="40" rx="3" fill="#3b82f6" />
              <Cpu x="-50" y="-10" className="w-5 h-5 text-cyan-300" />
              <text x="18" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="Inter">R1-EDGE Core FW</text>
            </g>

            {/* Hardware Render: CORE-SW Switch */}
            <g transform="translate(500, 255)" className="cursor-pointer transition-transform hover:scale-105" onClick={() => setSelectedNode({ name: 'CORE-SW Switch', type: 'Cisco Nexus 9000 Layer-3 Switch', ip: '10.0.0.2', vlan: 'Trunk Multi-VLAN', load: '65%' })}>
              <rect x="-75" y="-14" width="150" height="32" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
              <rect x="-75" y="-18" width="150" height="34" rx="4" fill="#0a1128" stroke="#818cf8" strokeWidth="1.5" filter="url(#glow)"/>
              <Server x="-60" y="-9" className="w-4 h-4 text-indigo-400" />
              <text x="12" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Inter">Trunk Core Switch</text>
            </g>

            {/* Hardware Render: Department Switches */}
            {NODES.map(node => (
              <g 
                key={node.id} transform={`translate(${node.x}, 350)`} 
                className="cursor-pointer transition-transform hover:-translate-y-2 hover:scale-110 duration-300"
                onMouseEnter={() => setHoveredNode(node)} onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode({ name: node.name, type: 'Access Switch Catalyst L2', ip: node.subnet, vlan: node.vlan, load: node.load, status: node.status })}
              >
                <rect x="-42" y="-16" width="84" height="32" rx="4" fill="#0a1128" stroke={THEME[node.id].color} strokeWidth="1.5" filter="url(#glow)"/>
                
                {/* Port Indicators */}
                <rect x="-32" y="-8" width="5" height="4" fill={THEME[node.id].color} opacity="0.9" />
                <rect x="-24" y="-8" width="5" height="4" fill={THEME[node.id].color} opacity="0.9" />
                <rect x="-16" y="-8" width="5" height="4" fill="#475569" />
                <rect x="-8" y="-8" width="5" height="4" fill={THEME[node.id].color} opacity="0.9" />

                <text x="0" y="8" textAnchor="middle" fill={THEME[node.id].color} fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">{node.id}</text>
                
                {/* Floating Pill Label */}
                <rect x="-45" y="24" width="90" height="20" rx="10" fill="rgba(10,17,40,0.95)" stroke="#334155" strokeWidth="1" />
                <text x="0" y="38" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="Inter" fontWeight="600">{node.name}</text>
              </g>
            ))}
          </svg>

          {/* Mouse Tracking Tooltip */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed pointer-events-none surface-panel p-4 shadow-2xl font-mono text-xs z-50 min-w-[210px] border-cyan-500/40 bg-slate-950/95 backdrop-blur-2xl"
                style={{ left: mousePos.x + 20, top: mousePos.y - 80 }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                  <div className="font-bold text-white">{hoveredNode.name}</div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-slate-400">VLAN ID:</span><span style={{ color: THEME[hoveredNode.id].color }} className="font-bold">{hoveredNode.vlan}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Subnet:</span><span className="text-slate-200">{hoveredNode.subnet}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Gateway:</span><span className="text-slate-200">{hoveredNode.subnet.replace('.0/24', '.1')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Throughput:</span><span className="text-cyan-400 font-bold">{hoveredNode.load}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Slide-in Inspector Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ x: 380, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 380, opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-80 shrink-0 surface-panel border-cyan-500/30 flex flex-col shadow-2xl z-20 bg-slate-950/95 backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="font-bold text-xs text-white flex items-center gap-2 tracking-widest uppercase font-mono">
                  <Settings className="w-4 h-4 text-cyan-400" /> Node Inspector
                </h3>
                <button 
                  onClick={() => setSelectedNode(null)} 
                  className="text-slate-400 hover:text-white transition-colors bg-slate-800/60 hover:bg-slate-700 p-1 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs flex-1 overflow-y-auto font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 tracking-widest uppercase mb-1">IDENTIFIER</div>
                  <div className="font-bold text-base text-white">{selectedNode.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 tracking-widest uppercase mb-1">HARDWARE PROFILE</div>
                  <div className="text-slate-200 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">{selectedNode.type}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 tracking-widest uppercase mb-1">NETWORK ADDRESS</div>
                  <div className="text-cyan-300 bg-cyan-950/30 px-3 py-2 rounded-lg border border-cyan-800/40 flex items-center justify-between">
                    <span>{selectedNode.ip}</span>
                    <Globe className="w-3.5 h-3.5 text-cyan-400 opacity-70" />
                  </div>
                </div>
                {selectedNode.vlan && (
                  <div>
                    <div className="text-[10px] text-slate-400 tracking-widest uppercase mb-1">DOT1Q TAG</div>
                    <div className="text-slate-200 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">{selectedNode.vlan}</div>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 tracking-widest uppercase mb-2.5 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> SECURITY EVENTS
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 transition-colors">
                      <span className="text-slate-200">TCP:443 → ANY</span>
                      <span className="text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Permit</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 transition-colors">
                      <span className="text-slate-200">ICMP Echo Req</span>
                      <span className="text-rose-300 bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Deny</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Packet Trace Log Drawer */}
      <div className="surface-panel flex flex-col h-40 shrink-0 shadow-xl overflow-hidden relative border-cyan-500/20 bg-slate-950">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Real-time Event Trace Terminal</span>
          </div>
          {simResult && (
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shadow-sm ${
                simResult.allowed 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                  : 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              }`}
            >
              {simResult.allowed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span>RESULT: {simResult.allowed ? 'DELIVERED' : 'BLOCKED'}</span>
            </motion.span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5 font-mono text-[11px] leading-relaxed bg-slate-950">
          <AnimatePresence>
            {logs.length === 0 && !isSimulating && (
              <div className="text-slate-500 h-full flex items-center justify-center italic">
                Ready for packet trace trigger. Select source, destination, and protocol above.
              </div>
            )}
            {logs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                <span className={
                  log.msg.includes('DROP') || log.msg.includes('TIMEOUT') 
                    ? 'text-rose-400 font-semibold' 
                    : log.msg.includes('PERMIT') || log.msg.includes('RX') 
                    ? 'text-emerald-400 font-semibold' 
                    : log.msg.includes('TX') 
                    ? 'text-cyan-400' 
                    : 'text-slate-300'
                }>
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
