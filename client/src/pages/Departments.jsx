import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Building, Plus, Trash2, Shield, Layers, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Departments() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [color, setColor] = useState('#ec4899');
  const [trust, setTrust] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiRequest('/api/network').then(res => res.departments)
  });

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!deptName || !deptName.trim()) {
      toast.error('Please enter department name');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiRequest('/api/admin/departments', {
        method: 'POST',
        body: JSON.stringify({ name: deptName, color, trust: Number(trust) })
      });

      toast.success(`Department '${res.name}' created`, {
        description: `Auto-assigned VLAN ${res.vlan} and Subnet ${res.subnet}`
      });

      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['network'] });
      queryClient.invalidateQueries({ queryKey: ['policy-matrix'] });

      setIsAddOpen(false);
      setDeptName('');
    } catch (err) {
      toast.error('Failed to create department', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    try {
      await apiRequest(`/api/admin/departments/${deptId}`, { method: 'DELETE' });
      toast.success(`Department ${deptId} deleted`);
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['network'] });
    } catch (err) {
      toast.error('Cannot delete department', { description: err.message });
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-zinc-400 font-mono text-xs">Loading department configuration...</div>;
  }

  const deptList = departments || [];
  const maxVlan = deptList.reduce((max, d) => Math.max(max, d.vlan), 0);
  const previewVlan = maxVlan + 10;
  const previewSubnet = `192.168.${previewVlan}.0/24`;

  return (
    <div className="space-y-6">
      <div className="surface-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-500" /> Department Subnet Management
          </h2>
          <p className="text-xs text-zinc-400">Configure corporate department subnets, VLAN allocations, and trust levels</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold text-xs transition-colors shadow-sm border-blue-500/50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Department</span>
        </button>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptList.map((d) => (
          <div key={d.id} className="surface-panel p-5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <h3 className="text-base font-bold text-zinc-100">{d.name}</h3>
              </div>
              <button
                onClick={() => handleDeleteDepartment(d.id)}
                className="text-zinc-500 hover:text-rose-400 p-1"
                title="Delete Department"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-zinc-800">
              <div className="bg-zinc-900/60 p-2 rounded-sm border border-zinc-800">
                <span className="text-zinc-500 text-[9px] block">VLAN ID</span>
                <span className="text-blue-400 font-bold">VLAN {d.vlan}</span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded-sm border border-zinc-800">
                <span className="text-zinc-500 text-[9px] block">TRUST LEVEL</span>
                <span className="text-purple-300 font-bold">Level {d.trust}/5</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 p-2 rounded-sm border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <span className="text-zinc-500 block text-[9px]">SUBNET / GATEWAY</span>
              {d.subnet} ({d.gateway})
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Wizard Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="surface-panel p-6 max-w-md w-full border-blue-600/40 shadow-sm border-blue-500/50 space-y-4 relative">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-zinc-100">Add Department Wizard</h3>

            <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Department Name</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g., Legal or Research"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-medium">Badge Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-sm cursor-pointer p-1"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-medium">Trust Level (1-5)</label>
                  <select
                    value={trust}
                    onChange={(e) => setTrust(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100"
                  >
                    {[1, 2, 3, 4, 5].map((t) => (
                      <option key={t} value={t}>Level {t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto Allocation Preview Card */}
              <div className="p-3 bg-zinc-900/90 rounded-sm border border-blue-600/30 text-xs font-mono space-y-1">
                <span className="text-[10px] text-blue-500 font-bold uppercase">Auto-Allocated Topology Settings:</span>
                <div className="text-zinc-300">VLAN ID: <span className="text-blue-400 font-bold">{previewVlan}</span></div>
                <div className="text-zinc-300">Subnet: <span className="text-blue-400 font-bold">{previewSubnet}</span></div>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold shadow-sm border-blue-500/50 cursor-pointer"
                >
                  {isSubmitting ? 'Allocating...' : 'Confirm Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
