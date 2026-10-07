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

const THEME = {
  HR: { color: '#22d3ee', name: 'cyan' },
  Finance: { color: '#3b82f6', name: 'blue' },
  IT: { color: '#8b5cf6', name: 'violet' },
  Sales: { color: '#10b981', name: 'emerald' },
  Management: { color: '#f59e0b', name: 'amber' },
  Servers: { color: '#f43f5e', name: 'rose' }
};

const NODES = [
  { id: 'HR', x: 150, y: 350, name: 'SW-HR', vlan: 'VLAN 10', subnet: '10.0.10.0/24', load: '12%' },
  { id: 'Finance', x: 290, y: 350, name: 'SW-FINANCE', vlan: 'VLAN 20', subnet: '10.0.20.0/24', load: '45%' },
  { id: 'IT', x: 430, y: 350, name: 'SW-IT', vlan: 'VLAN 30', subnet: '10.0.30.0/24', load: '88%' },
  { id: 'Sales', x: 570, y: 350, name: 'SW-SALES', vlan: 'VLAN 40', subnet: '10.0.40.0/24', load: '32%' },
  { id: 'Management', x: 710, y: 350, name: 'SW-MGMT', vlan: 'VLAN 50', subnet: '10.0.50.0/24', load: '8%' },
  { id: 'Servers', x: 850, y: 350, name: 'SW-SERVERS', vlan: 'VLAN 60', subnet: '10.0.60.0/24', load: '94%' }
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

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] space-y-4 overflow-hidden bg-[#050505] text-zinc-100 p-4 relative font-sans">
      
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        {[
          { label: 'Active VLANs', value: '12', color: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.1)]' },
          { label: 'Live Sessions', value: '8,432', color: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.1)]' },
          { label: 'Packets Dropped', value: '1,042', color: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.1)]' },
          { label: 'FW Policy Hits', value: '45.2k', color: 'text-violet-400', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.1)]' },
          { label: 'Core Health', value: '99.9%', color: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' }
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, type: 'spring' }}
            key={i} className={`bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 flex flex-col justify-center backdrop-blur-md ${kpi.glow}`}
          >
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{kpi.label}</span>
            <span className={`text-2xl font-black tracking-tight mt-1 ${kpi.color}`}>{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Traffic Test Control Bar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl shrink-0 shadow-lg"
      >
        <div className="flex items-center gap-2 px-2">
          <div className="relative">
            <Activity className="w-4 h-4 text-zinc-400" />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Diagnostic Trace</span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-3xl">
          <select value={simParams.srcDept} onChange={e => setSimParams({...simParams, srcDept: e.target.value})} className="flex-1 bg-[#0a0a0c] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
            {NODES.map(d => <option key={d.id} value={d.id}>SRC: {d.name}</option>)}
          </select>

          <button onClick={() => setSimParams(p => ({ ...p, srcDept: p.dstDept, dstDept: p.srcDept }))} className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <select value={simParams.dstDept} onChange={e => setSimParams({...simParams, dstDept: e.target.value})} className="flex-1 bg-[#0a0a0c] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-blue-500 transition-all outline-none">
            {NODES.map(d => <option key={d.id} value={d.id}>DST: {d.name}</option>)}
          </select>

          <select value={simParams.test} onChange={e => setSimParams({...simParams, test: e.target.value})} className="w-32 bg-[#0a0a0c] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 font-mono focus:ring-1 focus:ring-blue-500 transition-all outline-none">
            <option value="http">HTTP (80)</option>
            <option value="https">HTTPS (443)</option>
            <option value="ping">ICMP Ping</option>
            <option value="ssh">SSH (22)</option>
          </select>

          <button onClick={handleRunSimulation} disabled={isSimulating} className="flex items-center gap-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]">
            <Send className="w-3.5 h-3.5" /> {isSimulating ? 'Tracing...' : 'Transmit'}
          </button>
        </div>
      </motion.div>

      {/* Main Topology Canvas & Inspector */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        
        {/* SVG Canvas */}
        <div 
          className="flex-1 bg-[#050508] border border-zinc-800/80 rounded-lg overflow-hidden relative shadow-2xl"
          onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />
          
          <svg viewBox="0 0 1000 450" className="w-full h-full drop-shadow-2xl">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-intense" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Static Backbone Links */}
            <path d="M 500 60 L 500 130" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" fill="none" className="animate-[dash-flow_10s_linear_infinite]" />
            <path d="M 500 160 L 500 240" stroke="#64748b" strokeWidth="4" fill="none" />
            
            {/* Ambient Traffic & Links */}
            {NODES.map((node, i) => (
              <g key={`link-group-${node.id}`}>
                <path d={`M 500 270 Q 500 310 ${node.x} 320`} stroke={THEME[node.id].color} strokeWidth="1.5" fill="none" opacity="0.3" />
                
                {/* Outbound ambient particle */}
                <circle r="2" fill={THEME[node.id].color} filter="url(#glow)">
                  <animateMotion path={`M 500 240 L 500 270 Q 500 310 ${node.x} 320`} dur={`${3 + (i * 0.4)}s`} repeatCount="indefinite" />
                </circle>
                
                {/* Inbound ambient particle */}
                <circle r="1.5" fill="#fff" opacity="0.6">
                  <animateMotion path={`M ${node.x} 320 Q 500 310 500 270 L 500 240`} dur={`${2.5 + (i * 0.3)}s`} repeatCount="indefinite" />
                </circle>
              </g>
            ))}

            {/* Simulation Trace Path */}
            {isSimulating && (
              <circle r="8" fill="#fff" filter="url(#glow-intense)">
                <animateMotion 
                  path={`M ${NODES.find(n => n.id === simParams.srcDept).x} 320 Q 500 310 500 270 L 500 240 L 500 160`} 
                  dur="1.5s" fill="freeze" 
                />
              </circle>
            )}

            {/* Hardware Render: Internet Gateway */}
            <g transform="translate(500, 40)" className="cursor-pointer transition-all hover:scale-110" onClick={() => setSelectedNode({ name: 'Internet Gateway', type: 'WAN Edge', ip: '203.0.113.1' })}>
              <rect x="-60" y="-18" width="120" height="36" rx="4" fill="#09090b" stroke="#3b82f6" strokeWidth="1" filter="url(#glow)"/>
              <Globe x="-45" y="-8" className="w-4 h-4 text-blue-400" />
              <text x="10" y="4" textAnchor="middle" fill="#f4f4f5" fontSize="11" fontWeight="600" fontFamily="Inter">Internet Edge</text>
            </g>

            {/* Hardware Render: R1-EDGE Router */}
            <g transform="translate(500, 145)" className="cursor-pointer transition-all hover:scale-105" onClick={() => setSelectedNode({ name: 'R1-EDGE Router', type: 'Cisco ISR 4331 Firewall', ip: '10.0.0.1' })}>
              <rect x="-65" y="-20" width="130" height="40" rx="4" fill="#09090b" stroke="#e2e8f0" strokeWidth="1.5" filter="url(#glow)"/>
              <rect x="-65" y="-20" width="8" height="40" rx="2" fill="#3b82f6" />
              <Cpu x="-45" y="-10" className="w-5 h-5 text-slate-300" />
              <text x="16" y="4" textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="bold" fontFamily="Inter">R1-EDGE Core</text>
            </g>

            {/* Hardware Render: CORE-SW Switch */}
            <g transform="translate(500, 255)" className="cursor-pointer transition-all hover:scale-105" onClick={() => setSelectedNode({ name: 'CORE-SW Switch', type: 'Cisco Nexus 9k', ip: '10.0.0.2' })}>
              {/* Stacked 3D look */}
              <rect x="-70" y="-12" width="140" height="32" rx="2" fill="#18181b" stroke="#475569" strokeWidth="1" />
              <rect x="-70" y="-16" width="140" height="32" rx="2" fill="#09090b" stroke="#94a3b8" strokeWidth="1.5" filter="url(#glow)"/>
              <Server x="-55" y="-8" className="w-4 h-4 text-slate-400" />
              <text x="10" y="4" textAnchor="middle" fill="#f4f4f5" fontSize="11" fontWeight="bold" fontFamily="Inter">Trunk Core Switch</text>
            </g>

            {/* Hardware Render: Department Switches */}
            {NODES.map(node => (
              <g 
                key={node.id} transform={`translate(${node.x}, 350)`} 
                className="cursor-pointer transition-transform hover:-translate-y-2 hover:scale-110 duration-300"
                onMouseEnter={() => setHoveredNode(node)} onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode({ name: node.name, type: 'Access Switch L2', ip: node.subnet, vlan: node.vlan, load: node.load })}
              >
                <rect x="-40" y="-16" width="80" height="32" rx="3" fill="#09090b" stroke={THEME[node.id].color} strokeWidth="1.5" filter="url(#glow)"/>
                
                {/* Port Indicators (Mock) */}
                <rect x="-30" y="-8" width="6" height="4" fill={THEME[node.id].color} opacity="0.8" />
                <rect x="-20" y="-8" width="6" height="4" fill={THEME[node.id].color} opacity="0.8" />
                <rect x="-10" y="-8" width="6" height="4" fill="#3f3f46" />
                <rect x="0" y="-8" width="6" height="4" fill={THEME[node.id].color} opacity="0.8" />

                <text x="0" y="8" textAnchor="middle" fill={THEME[node.id].color} fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">{node.id}</text>
                
                {/* Floating Pill Label */}
                <rect x="-45" y="24" width="90" height="20" rx="10" fill="rgba(9,9,11,0.9)" stroke="#27272a" strokeWidth="1" />
                <text x="0" y="38" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="Inter" fontWeight="600">{node.name}</text>
              </g>
            ))}
          </svg>

          {/* Absolute Mouse Tracking Tooltip */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="fixed pointer-events-none bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 p-4 rounded-xl shadow-2xl font-mono text-xs z-50 min-w-[200px]"
                style={{ left: mousePos.x + 20, top: mousePos.y - 80 }}
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <div className="font-bold text-zinc-100">{hoveredNode.name}</div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-zinc-500">VLAN ID:</span><span style={{ color: THEME[hoveredNode.id].color }}>{hoveredNode.vlan}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Subnet:</span><span className="text-zinc-300">{hoveredNode.subnet}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Gateway:</span><span className="text-zinc-300">{hoveredNode.subnet.replace('.0/24', '.1')}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Throughput:</span><span className="text-zinc-300">{hoveredNode.load}</span></div>
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
              className="w-80 shrink-0 bg-zinc-950/90 border border-zinc-800 rounded-lg backdrop-blur-2xl flex flex-col shadow-2xl z-20"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/30">
                <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2 tracking-wide uppercase">
                  <Settings className="w-4 h-4 text-blue-400" /> Node Inspector
                </h3>
                <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700 p-1 rounded"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-5 text-xs flex-1 overflow-y-auto">
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">IDENTIFIER</div>
                  <div className="font-bold text-lg text-zinc-100">{selectedNode.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">HARDWARE PROFILE</div>
                  <div className="text-zinc-300 bg-zinc-900 px-3 py-2 rounded border border-zinc-800/50">{selectedNode.type}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">NETWORK ADDRESS</div>
                  <div className="font-mono text-blue-300 bg-blue-950/20 px-3 py-2 rounded border border-blue-900/50 flex items-center justify-between">
                    <span>{selectedNode.ip}</span>
                    <Globe className="w-3.5 h-3.5 opacity-50" />
                  </div>
                </div>
                {selectedNode.vlan && (
                  <div>
                    <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">DOT1Q TAG</div>
                    <div className="font-mono text-zinc-300 bg-zinc-900 px-3 py-2 rounded border border-zinc-800/50">{selectedNode.vlan}</div>
                  </div>
                )}
                <div className="pt-5 border-t border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5" /> SECURITY EVENTS
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-zinc-900/80 p-2.5 rounded border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                      <span className="text-zinc-300 font-mono">TCP:443 -> ANY</span><span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Permit</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-900/80 p-2.5 rounded border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                      <span className="text-zinc-300 font-mono">ICMP Echo Req</span><span className="text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Deny</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Packet Trace Log Drawer */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col h-40 shrink-0 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 opacity-20" />
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Real-time Event Trace</span>
          </div>
          {simResult && (
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 shadow-sm ${simResult.allowed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'}`}
            >
              {simResult.allowed ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
              RESULT: {simResult.allowed ? 'DELIVERED' : 'BLOCKED'}
            </motion.span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px] leading-relaxed bg-[#0a0a0c]">
          <AnimatePresence>
            {logs.length === 0 && !isSimulating && (
              <div className="text-zinc-600 h-full flex items-center justify-center italic">Waiting for packet trace trigger...</div>
            )}
            {logs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4">
                <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                <span className={log.msg.includes('DROP') || log.msg.includes('TIMEOUT') ? 'text-rose-400 font-semibold' : log.msg.includes('PERMIT') || log.msg.includes('RX') ? 'text-emerald-400 font-semibold' : log.msg.includes('TX') ? 'text-blue-400' : 'text-zinc-300'}>
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
