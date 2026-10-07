import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  FolderLock, Lock, ShieldAlert, ArrowRight, Send, Sparkles, 
  Cloud, Database, Globe, Wrench, Search, Edit3, Eye, Filter, Server, Plus, Trash2, X
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, previewDept } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedLockedRes, setSelectedLockedRes] = useState(null);
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Create Resource Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    category: 'internal_web_app',
    ownerDepartment: 'IT',
    accessLevel: 'restricted',
    endpoint: '',
    ipAddress: '',
    service: 'http',
    sensitivity: 'medium',
    description: ''
  });

  const effectiveDept = previewDept || user?.department || 'IT';

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources', effectiveDept],
    queryFn: () => apiRequest('/api/resources')
  });

  const categoryOptions = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'cloud_infrastructure', label: 'Cloud Infra', icon: Cloud },
    { id: 'database_instance', label: 'Databases', icon: Database },
    { id: 'internal_web_app', label: 'Web Apps', icon: Globe },
    { id: 'network_tool', label: 'Network Tools', icon: Wrench },
  ];

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    return resources.filter(res => {
      // Category filter
      if (selectedCategory !== 'ALL' && res.category !== selectedCategory) {
        return false;
      }
      // Department filter
      if (selectedDeptFilter !== 'ALL' && res.ownerDepartment !== selectedDeptFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = res.name?.toLowerCase().includes(q);
        const matchDesc = res.description?.toLowerCase().includes(q);
        const matchEndpoint = (res.endpoint || res.ipAddress || '').toLowerCase().includes(q);
        const matchId = res.id?.toLowerCase().includes(q);
        return matchName || matchDesc || matchEndpoint || matchId;
      }
      return true;
    });
  }, [resources, selectedCategory, selectedDeptFilter, searchQuery]);

  const stats = useMemo(() => {
    if (!resources) return { total: 0, accessible: 0, writable: 0 };
    return {
      total: resources.length,
      accessible: resources.filter(r => r.accessible).length,
      writable: resources.filter(r => r.canEdit).length
    };
  }, [resources]);

  const handleOpenResource = (resObj) => {
    if (resObj.accessible) {
      navigate(`/resources/${resObj.id}`);
    } else {
      setSelectedLockedRes(resObj);
    }
  };

  const handleSendAccessRequest = async () => {
    if (!requestReason || !requestReason.trim()) {
      toast.error('Please enter a justification reason');
      return;
    }

    try {
      setIsSubmittingReq(true);
      await apiRequest('/api/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          resourceId: selectedLockedRes.id,
          reason: requestReason
        })
      });
      toast.success('Access request submitted to SecOps admin');
      setSelectedLockedRes(null);
      setRequestReason('');
    } catch (err) {
      toast.error('Failed to submit request', { description: err.message });
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleCreateResourceSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Resource name is required');
      return;
    }

    try {
      setIsCreating(true);
      const res = await apiRequest('/api/resources', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      toast.success(`Resource '${res.resource.name}' created successfully!`);
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        category: 'internal_web_app',
        ownerDepartment: effectiveDept,
        accessLevel: 'restricted',
        endpoint: '',
        ipAddress: '',
        service: 'http',
        sensitivity: 'medium',
        description: ''
      });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    } catch (err) {
      toast.error('Failed to create resource', { description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteResource = async (e, resObj) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete '${resObj.name}'?`)) {
      return;
    }

    try {
      await apiRequest(`/api/resources/${resObj.id}`, {
        method: 'DELETE'
      });
      toast.success(`Resource '${resObj.name}' deleted`);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    } catch (err) {
      toast.error('Failed to delete resource', { description: err.message });
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'cloud_infrastructure':
        return <Cloud className="w-4 h-4 text-sky-400" />;
      case 'database_instance':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'internal_web_app':
        return <Globe className="w-4 h-4 text-purple-400" />;
      case 'network_tool':
        return <Wrench className="w-4 h-4 text-amber-400" />;
      default:
        return <Server className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'cloud_infrastructure':
        return 'bg-sky-950/70 border-sky-800 text-sky-300';
      case 'database_instance':
        return 'bg-emerald-950/70 border-emerald-800 text-emerald-300';
      case 'internal_web_app':
        return 'bg-purple-950/70 border-purple-800 text-purple-300';
      case 'network_tool':
        return 'bg-amber-950/70 border-amber-800 text-amber-300';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Active Department Summary */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-glowCyan">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Welcome, {user?.name || user?.email}</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400">
            Assigned Department: <span className="font-bold text-cyan-400">{effectiveDept}</span> | Role: <span className="font-mono text-purple-300">{user?.role}</span>
          </p>
        </div>

        {/* Dynamic Resource Access Summary Cards & Create Resource Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-500 block">TOTAL RESOURCES</span>
            <span className="text-cyan-300 font-bold text-sm">{stats.total}</span>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-500 block">READABLE</span>
            <span className="text-emerald-400 font-bold text-sm">{stats.accessible}</span>
          </div>
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-500 block">EDITABLE</span>
            <span className="text-purple-300 font-bold text-sm">{stats.writable}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateForm(prev => ({ ...prev, ownerDepartment: effectiveDept }));
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-glowCyan transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Resource</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search portal resources by name, endpoint, IP..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {categoryOptions.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glowCyan'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Departments</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="IT">IT</option>
            <option value="Sales">Sales</option>
            <option value="Management">Management</option>
            <option value="Servers">Servers</option>
          </select>
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-cyan-400" /> 
            Enterprise Network Portal Resources ({filteredResources.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading resource security matrix & RBAC policies...</div>
        ) : filteredResources.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs glass-panel">
            No portal resources match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resObj) => {
              const isLocked = !resObj.accessible;
              const canEdit = resObj.canEdit;

              return (
                <div
                  key={resObj.id}
                  onClick={() => handleOpenResource(resObj)}
                  className={`glass-panel p-5 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4 ${
                    isLocked
                      ? 'border-rose-500/30 hover:border-rose-500/80 hover:shadow-glowRose'
                      : canEdit
                      ? 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-glowCyan'
                      : 'border-amber-500/30 hover:border-amber-400'
                  }`}
                >
                  {/* Top Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${getCategoryBadgeClass(resObj.category)}`}>
                          {getCategoryIcon(resObj.category)}
                          {(resObj.category || 'resource').replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {resObj.ownerDepartment}
                        </span>
                      </div>

                      {/* Read / Write Status & Delete Button */}
                      <div className="flex items-center gap-1.5">
                        {isLocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300">
                            <Lock className="w-3 h-3 text-rose-400" />
                            LOCKED
                          </span>
                        ) : canEdit ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                            <Edit3 className="w-3 h-3 text-emerald-400" />
                            READ/WRITE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
                            <Eye className="w-3 h-3 text-amber-400" />
                            READ ONLY
                          </span>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteResource(e, resObj)}
                            title="Delete Resource"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-100 flex items-center justify-between">
                      <span>{resObj.name}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Status: ONLINE" />
                    </h4>

                    {/* Endpoint / IP Display */}
                    {(resObj.endpoint || resObj.ipAddress) && (
                      <div className="font-mono text-[11px] text-cyan-400/90 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/80 truncate">
                        {resObj.endpoint || resObj.ipAddress}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {resObj.description}
                  </p>

                  {/* Footer Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase ${
                        resObj.sensitivity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        resObj.sensitivity === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-900 text-slate-400'
                      }`}>
                        {resObj.sensitivity || 'NORMAL'}
                      </span>
                      {resObj.accessLevel && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300 uppercase">
                          {resObj.accessLevel}
                        </span>
                      )}
                    </div>

                    <span className={`flex items-center gap-1 font-medium text-xs ${isLocked ? 'text-rose-400' : 'text-cyan-400'}`}>
                      {isLocked ? 'Request Access' : canEdit ? 'View & Edit' : 'View Content'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Resource Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 max-w-lg w-full border-cyan-500/50 shadow-glowCyan space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" /> Create New Portal Resource
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResourceSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300">Resource Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Production Redis Secondary Cluster"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="cloud_infrastructure">Cloud Infrastructure</option>
                    <option value="database_instance">Database Instance</option>
                    <option value="internal_web_app">Internal Web Application</option>
                    <option value="network_tool">Network Tool</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">Owner Department</label>
                  <select
                    value={createForm.ownerDepartment}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, ownerDepartment: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="IT">IT</option>
                    <option value="Sales">Sales</option>
                    <option value="Management">Management</option>
                    <option value="Servers">Servers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300">Endpoint Address</label>
                  <input
                    type="text"
                    value={createForm.endpoint}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="e.g. redis-slave.internal:6379"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">IP Address</label>
                  <input
                    type="text"
                    value={createForm.ipAddress}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, ipAddress: e.target.value }))}
                    placeholder="e.g. 192.168.30.45"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300">Access Level</label>
                  <select
                    value={createForm.accessLevel}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, accessLevel: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="public">public</option>
                    <option value="restricted">restricted</option>
                    <option value="confidential">confidential</option>
                    <option value="top_secret">top_secret</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">Sensitivity</label>
                  <select
                    value={createForm.sensitivity}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, sensitivity: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">Service Protocol</label>
                  <select
                    value={createForm.service}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="http">http</option>
                    <option value="dns">dns</option>
                    <option value="icmp">icmp</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of resource purpose and ownership..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-glowCyan cursor-pointer"
                >
                  {isCreating ? 'Creating...' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Restricted Modal / Drawer */}
      {selectedLockedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 max-w-md w-full border-rose-500/50 shadow-glowRose space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Access Restricted</h3>
                <p className="text-xs text-slate-400">Firewall ACL Policy Enforcement</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="font-mono text-[10px] text-rose-400 uppercase">Enforcement Reason:</span>
              <p className="font-mono leading-relaxed text-slate-200">{selectedLockedRes.reason}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Submit Access Request Justification</label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Explain business justification for temporary exception access..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSelectedLockedRes(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendAccessRequest}
                disabled={isSubmittingReq}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shadow-glowCyan cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
