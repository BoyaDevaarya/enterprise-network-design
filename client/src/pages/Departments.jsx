import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Building, Plus, Trash2, Shield, Layers, X, Cpu, Radio } from 'lucide-react';
import { toast } from 'sonner';

export default function Departments() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [color, setColor] = useState('#06b6d4');
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
    return <div className="p-16 text-center text-slate-400 font-mono text-xs surface-panel border-cyan-500/20">Loading department VLAN configuration...</div>;
  }

  const deptList = departments || [];
  const maxVlan = deptList.reduce((max, d) => Math.max(max, d.vlan), 0);
  const previewVlan = maxVlan + 10;
  const previewSubnet = `192.168.${previewVlan}.0/24`;

  return (
    <div className="space-y-6">
      <div className="surface-panel p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              VLAN SEGMENTATION
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" /> Department Subnet & VLAN Management
          </h2>
          <p className="text-xs text-slate-400 font-mono">Configure corporate department subnets, 802.1Q VLAN allocations, and trust levels</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Department</span>
        </button>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {deptList.map((d) => (
          <div key={d.id} className="surface-panel p-5 space-y-4 border-cyan-500/20 shadow-xl hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                <h3 className="text-base font-bold text-white">{d.name}</h3>
              </div>
              <button
                onClick={() => handleDeleteDepartment(d.id)}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete Department"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[9px] block uppercase font-bold">VLAN ID</span>
                <span className="text-cyan-400 font-bold text-sm">VLAN {d.vlan}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[9px] block uppercase font-bold">TRUST LEVEL</span>
                <span className="text-purple-300 font-bold text-sm">Level {d.trust}/5</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">SUBNET / GATEWAY</span>
                <span className="text-slate-200">{d.subnet}</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                GW: {d.gateway}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Wizard Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="surface-panel p-6 max-w-md w-full border-cyan-500/40 shadow-2xl space-y-4 relative bg-slate-900/95">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" /> Add Department Wizard
            </h3>

            <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">Department Name</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Legal or Research"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">Badge Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer p-1"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">Trust Level (1-5)</label>
                  <select
                    value={trust}
                    onChange={(e) => setTrust(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((t) => (
                      <option key={t} value={t}>Level {t} Clearance</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto Allocation Preview Card */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-cyan-500/30 text-xs font-mono space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block">Auto-Allocated Topology Settings:</span>
                <div className="text-slate-300">VLAN ID: <span className="text-cyan-400 font-bold">{previewVlan}</span></div>
                <div className="text-slate-300">Subnet: <span className="text-cyan-400 font-bold">{previewSubnet}</span></div>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-md cursor-pointer"
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
