import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Network,
  FolderLock,
  Grid,
  Terminal,
  ShieldCheck,
  FileCode,
  Building,
  Users,
  Inbox,
  History,
  Activity,
  Zap,
  Radio
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const operationsItems = [
    { to: '/', label: 'Network Map', icon: Network, badge: 'LIVE' },
    { to: '/resources', label: 'Portal Resources', icon: FolderLock },
    { to: '/test-lab', label: 'Test Lab', icon: Terminal },
    { to: '/compliance', label: 'Compliance Posture', icon: ShieldCheck },
    { to: '/config', label: 'Config Generator', icon: FileCode }
  ];

  const adminItems = [
    { to: '/matrix', label: 'Policy Matrix 2.0', icon: Grid },
    { to: '/departments', label: 'Departments', icon: Building },
    { to: '/users', label: 'User Directory', icon: Users },
    { to: '/access-requests', label: 'Access Requests', icon: Inbox },
    { to: '/audit', label: 'Audit Log Stream', icon: History }
  ];

  const NavItem = ({ item, isAdminBadge = false }) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
              : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700/50'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r shadow-[0_0_8px_#22d3ee]" />
            )}
            <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span className="truncate">{item.label}</span>

            {item.badge && (
              <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                {item.badge}
              </span>
            )}

            {isAdminBadge && (
              <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded text-purple-300 bg-purple-950/60 border border-purple-800/60 group-hover:border-purple-600 transition-colors">
                ADMIN
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 surface-panel !rounded-none !border-y-0 !border-l-0 border-r border-cyan-500/15 min-h-[calc(100vh-53px)] p-4 space-y-6 overflow-y-auto bg-slate-950/80 backdrop-blur-xl">
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono font-bold tracking-widest text-cyan-400/80 uppercase px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]"></span>
              <span>Operations Core</span>
            </div>
            <span className="text-[9px] text-slate-500">v2.4</span>
          </div>
          <div className="space-y-1">
            {operationsItems.map(item => <NavItem key={item.to} item={item} />)}
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-1.5 pt-4 border-t border-slate-800/80">
            <div className="text-[10px] font-mono font-bold tracking-widest text-purple-400/80 uppercase px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_6px_#c084fc]"></span>
                <span>SecOps Admin</span>
              </div>
              <span className="text-[9px] text-purple-400/60">ROOT</span>
            </div>
            <div className="space-y-1">
              {adminItems.map(item => <NavItem key={item.to} item={item} isAdminBadge={true} />)}
            </div>
          </div>
        )}

        {/* Telemetry Footer Status */}
        <div className="mt-auto pt-6 border-t border-slate-800/60 text-[10px] font-mono text-slate-500 space-y-2">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-cyan-400" /> ACL ENGINE
              </span>
              <span className="text-emerald-400 font-bold">ARMED</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[92%]" />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>99.9% Firewall Sync</span>
              <span className="text-cyan-400">0 dropped</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 surface-panel !rounded-none !border-x-0 !border-b-0 border-t border-cyan-500/20 px-2 py-2 flex items-center justify-around overflow-x-auto bg-slate-950/95 backdrop-blur-2xl">
        {[...operationsItems, ...(isAdmin ? adminItems : [])].slice(0, 5).map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all ${
                  isActive 
                    ? 'text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
