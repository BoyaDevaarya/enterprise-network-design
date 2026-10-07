import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Users as UsersIcon, UserPlus, Lock, CheckCircle2, XCircle, Trash2, X } from 'lucide-react';
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
    return <div className="p-12 text-center text-zinc-400 font-mono text-xs">Loading accounts database...</div>;
  }

  const deptList = departments || [];

  return (
    <div className="space-y-6">
      <div className="surface-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-500" /> Console User Management
          </h2>
          <p className="text-xs text-zinc-400">Manage console identity accounts, roles, and department assignments</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold text-xs transition-colors shadow-sm border-blue-500/50 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Console User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="surface-panel p-6 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase">
              <th className="py-3 px-4">Name / Email</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-900/50">
                <td className="py-3 px-4">
                  <div className="font-bold text-zinc-200">{u.name}</div>
                  <div className="text-[11px] text-zinc-400">{u.email}</div>
                </td>
                <td className="py-3 px-4 font-bold text-blue-500">{u.department}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.role === 'ADMIN' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                    u.disabled ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {u.disabled ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {u.disabled ? 'Disabled' : 'Active'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => handleToggleDisabled(u)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-1 text-zinc-500 hover:text-rose-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="surface-panel p-6 max-w-md w-full border-blue-600/40 shadow-sm border-blue-500/50 space-y-4 relative">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-zinc-100">Create Console Account</h3>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprisenet.local"
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-medium">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100"
                  >
                    {deptList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1 font-medium">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 font-mono"
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
                  className="px-4 py-2 rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold shadow-sm border-blue-500/50 cursor-pointer"
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
