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
  History
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { to: '/', label: 'Network Map', icon: Network, adminOnly: false },
    { to: '/resources', label: 'Portal Resources', icon: FolderLock, adminOnly: false },
    { to: '/matrix', label: 'Policy Matrix', icon: Grid, adminOnly: true },
    { to: '/test-lab', label: 'Test Lab', icon: Terminal, adminOnly: false },
    { to: '/compliance', label: 'Compliance', icon: ShieldCheck, adminOnly: false },
    { to: '/config', label: 'Config Generator', icon: FileCode, adminOnly: false },
    { to: '/departments', label: 'Departments', icon: Building, adminOnly: true },
    { to: '/users', label: 'Users', icon: Users, adminOnly: true },
    { to: '/access-requests', label: 'Access Requests', icon: Inbox, adminOnly: true },
    { to: '/audit', label: 'Audit Log', icon: History, adminOnly: true }
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel !rounded-none !border-y-0 !border-l-0 min-h-[calc(100vh-57px)] p-4 space-y-1">
        <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase px-3 py-2">
          Operations Navigation
        </div>
        {visibleItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-glowCyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {item.adminOnly && (
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                  ADMIN
                </span>
              )}
            </NavLink>
          );
        })}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel !rounded-none !border-x-0 !border-b-0 px-2 py-2 flex items-center justify-around overflow-x-auto">
        {visibleItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
