import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Users as UsersIcon, UserPlus, Lock, CheckCircle2, XCircle, Trash2, X, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function Users() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [department, setDepartment] = useState('HR');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest('/api/admin/users')
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiRequest('/api/network').then(res => res.departments)
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role, department })
      });
      toast.success(`User ${email} created`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddOpen(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      toast.error('Failed to create user', { description: err.message });
    }
  };

  const handleToggleDisabled = async (userObj) => {
    try {
      await apiRequest(`/api/admin/users/${userObj.id}`, {
        method: 'PUT',
        body: JSON.stringify({ disabled: !userObj.disabled })
      });
      toast.info(`User ${userObj.email} ${!userObj.disabled ? 'disabled' : 'enabled'}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      toast.error('Failed to update user status', { description: err.message });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE' });
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      toast.error('Failed to delete user', { description: err.message });
    }
  };

  if (isLoading) {
    return <div className="p-16 text-center text-slate-400 font-mono text-xs surface-panel border-cyan-500/20">Loading accounts database & IAM identity mapping...</div>;
  }

  const deptList = departments || [];

  return (
    <div className="space-y-6">
      <div className="surface-panel p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              IAM DIRECTORY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-cyan-400" /> Console User & Identity Directory
          </h2>
          <p className="text-xs text-slate-400 font-mono">Manage operator identities, department memberships, and role clearance</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Console User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="surface-panel p-6 overflow-x-auto border-cyan-500/20 shadow-2xl">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase bg-slate-950/60">
              <th className="py-3 px-4">Operator Identity</th>
              <th className="py-3 px-4">Assigned Department</th>
              <th className="py-3 px-4">Role Clearance</th>
              <th className="py-3 px-4">Account Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
                      {u.name ? u.name[0] : 'U'}
                    </div>
                    <span>{u.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 ml-8">{u.email}</div>
                </td>
                <td className="py-3.5 px-4 font-bold text-cyan-400">{u.department}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    u.role === 'ADMIN' ? 'bg-purple-950/80 text-purple-300 border-purple-600/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    u.disabled ? 'bg-rose-950 text-rose-300 border-rose-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {u.disabled ? <XCircle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{u.disabled ? 'Disabled' : 'Active'}</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    onClick={() => handleToggleDisabled(u)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="surface-panel p-6 max-w-md w-full border-cyan-500/40 shadow-2xl space-y-4 relative bg-slate-900/95">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" /> Create Console Account
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprisenet.local"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none cursor-pointer"
                  >
                    {deptList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none cursor-pointer"
                  >
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
