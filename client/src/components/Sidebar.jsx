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
  ChevronDown
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const operationsItems = [
    { to: '/', label: 'Network Map', icon: Network },
    { to: '/resources', label: 'Portal Resources', icon: FolderLock },
    { to: '/test-lab', label: 'Test Lab', icon: Terminal },
    { to: '/compliance', label: 'Compliance', icon: ShieldCheck },
    { to: '/config', label: 'Config Generator', icon: FileCode }
  ];

  const adminItems = [
    { to: '/matrix', label: 'Policy Matrix', icon: Grid },
    { to: '/departments', label: 'Departments', icon: Building },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/access-requests', label: 'Access Requests', icon: Inbox },
    { to: '/audit', label: 'Audit Log', icon: History }
  ];

  const NavItem = ({ item, isAdminBadge = false }) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          `group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
            isActive
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/40'
          }`
        }
      >
        <Icon className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
        <span>{item.label}</span>
        {isAdminBadge && (
          <span className="ml-auto text-[8px] font-mono px-1 py-0.5 rounded text-slate-500 bg-slate-800/50 border border-slate-700/50 group-hover:text-slate-400 transition-colors">
            ADMIN
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel !rounded-none !border-y-0 !border-l-0 min-h-[calc(100vh-57px)] p-4 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <div className="text-[10px] font-mono tracking-wider text-cyan-500/70 uppercase px-3 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></span>
            Operations
          </div>
          {operationsItems.map(item => <NavItem key={item.to} item={item} />)}
        </div>

        {isAdmin && (
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-wider text-purple-500/70 uppercase px-3 py-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></span>
              Administration
            </div>
            {adminItems.map(item => <NavItem key={item.to} item={item} isAdminBadge={true} />)}
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel !rounded-none !border-x-0 !border-b-0 px-2 py-2 flex items-center justify-around overflow-x-auto">
        {[...operationsItems, ...(isAdmin ? adminItems : [])].slice(0, 5).map(item => {
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
