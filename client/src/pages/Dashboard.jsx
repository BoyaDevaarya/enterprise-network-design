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
        return <Server className="w-4 h-4 text-blue-500" />;
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
        return 'bg-zinc-900 border-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Active Department Summary */}
      <div className="surface-panel p-6 flex flex-wrap items-center justify-between gap-4 border-blue-600/30 shadow-sm border-blue-500/50">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span>Welcome, {user?.name || user?.email}</span>
            <Sparkles className="w-5 h-5 text-blue-500" />
          </h2>
          <p className="text-xs text-zinc-400">
            Assigned Department: <span className="font-bold text-blue-500">{effectiveDept}</span> | Role: <span className="font-mono text-purple-300">{user?.role}</span>
          </p>
        </div>

        {/* Dynamic Resource Access Summary Cards & Create Resource Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-zinc-900/90 p-3 rounded-sm border border-zinc-800 text-center font-mono">
            <span className="text-[10px] text-zinc-500 block">TOTAL RESOURCES</span>
            <span className="text-blue-400 font-bold text-sm">{stats.total}</span>
          </div>
          <div className="bg-zinc-900/90 p-3 rounded-sm border border-zinc-800 text-center font-mono">
            <span className="text-[10px] text-zinc-500 block">READABLE</span>
            <span className="text-emerald-400 font-bold text-sm">{stats.accessible}</span>
          </div>
          <div className="bg-zinc-900/90 p-3 rounded-sm border border-zinc-800 text-center font-mono">
            <span className="text-[10px] text-zinc-500 block">EDITABLE</span>
            <span className="text-purple-300 font-bold text-sm">{stats.writable}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateForm(prev => ({ ...prev, ownerDepartment: effectiveDept }));
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-3 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold text-xs shadow-sm border-blue-500/50 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Resource</span>
          </button>
        </div>
      </div>

      {/* Unified Filter & Search Toolbar */}
      <div className="sticky top-0 z-20 surface-panel p-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 border-y border-zinc-800/80 shadow-md bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search portal resources..."
              className="w-full bg-zinc-900/90 border border-zinc-700 rounded-sm pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
            <Filter className={`w-3.5 h-3.5 ${selectedDeptFilter !== 'ALL' ? 'text-blue-500' : 'text-zinc-500'}`} />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className={`bg-zinc-900 border rounded-sm px-3 py-2 text-xs focus:outline-none transition-colors ${selectedDeptFilter !== 'ALL' ? 'border-blue-600/50 text-blue-400' : 'border-zinc-700 text-zinc-300 focus:border-blue-600'}`}
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

        {/* Category Pills & Reset */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3">
            {categoryOptions.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
          
          {(searchQuery || selectedCategory !== 'ALL' || selectedDeptFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedDeptFilter('ALL');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-blue-500" /> 
            Enterprise Network Portal Resources ({filteredResources.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-400 font-mono text-xs">Loading resource security matrix & RBAC policies...</div>
        ) : filteredResources.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 font-mono text-xs surface-panel">
            No portal resources match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((resObj) => {
              const isLocked = !resObj.accessible;
              const canEdit = resObj.canEdit;

              return (
                <div
                  key={resObj.id}
                  onClick={() => handleOpenResource(resObj)}
                  className={`group surface-panel p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col min-h-[260px] ${
                    isLocked
                      ? 'border-zinc-800 hover:border-rose-500/60 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : canEdit
                      ? 'border-zinc-800 hover:border-emerald-500/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'border-zinc-800 hover:border-blue-600/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  }`}
                >
                  {/* Two-Tier Header inside Card */}
                  <div className="flex flex-col gap-3 mb-4">
                    {/* Tier 1: Resource Type, Security Class, R/W State */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${getCategoryBadgeClass(resObj.category)}`}>
                          {getCategoryIcon(resObj.category)}
                          {(resObj.category || 'resource').replace('_', ' ')}
                        </span>
                        
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase ${
                          resObj.sensitivity === 'critical' ? 'bg-rose-500/20 text-rose-200 border border-rose-500' :
                          resObj.sensitivity === 'high' ? 'bg-amber-500/20 text-amber-200 border border-amber-500' :
                          'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          {resObj.sensitivity || 'NORMAL'}
                        </span>

                        {resObj.accessLevel === 'top_secret' && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-rose-600/30 border border-rose-500 text-rose-100 uppercase">
                            TOP SECRET
                          </span>
                        )}
                      </div>

                      {/* Read / Write Status & Delete Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/50 text-rose-400">
                            <Lock className="w-3 h-3" />
                            LOCKED
                          </span>
                        ) : canEdit ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/50 text-emerald-400">
                            <Edit3 className="w-3 h-3" />
                            R/W
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/50 text-amber-400">
                            <Eye className="w-3 h-3" />
                            R/O
                          </span>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteResource(e, resObj)}
                            title="Delete Resource"
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tier 2: Title & Endpoint */}
                    <div>
                      <h4 className="text-base font-bold text-zinc-100 flex items-center justify-between mb-2">
                        <span className="line-clamp-1">{resObj.name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-2" title="Status: ONLINE" />
                      </h4>
                      
                      {(resObj.endpoint || resObj.ipAddress) && (
                        <div className="font-mono text-[11px] text-blue-400 bg-cyan-950/30 px-2.5 py-1.5 rounded border border-cyan-900/50 break-all leading-tight">
                          {resObj.endpoint || resObj.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description - Takes available space */}
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400 leading-relaxed overflow-hidden">
                      {resObj.description}
                    </p>
                  </div>

                  {/* Footer Bar */}
                  <div className="pt-3 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/50 text-zinc-400 border border-zinc-700">
                        Owner: {resObj.ownerDepartment}
                      </span>
                    </div>

                    <span className={`flex items-center gap-1 font-medium text-xs transition-transform group-hover:translate-x-1 ${isLocked ? 'text-rose-400' : 'text-blue-500'}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="surface-panel p-6 max-w-lg w-full border-blue-600/50 shadow-sm border-blue-500/50 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" /> Create New Portal Resource
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResourceSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-zinc-300">Resource Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Production Redis Secondary Cluster"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="cloud_infrastructure">Cloud Infrastructure</option>
                    <option value="database_instance">Database Instance</option>
                    <option value="internal_web_app">Internal Web Application</option>
                    <option value="network_tool">Network Tool</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300">Owner Department</label>
                  <select
                    value={createForm.ownerDepartment}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, ownerDepartment: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
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
                  <label className="text-zinc-300">Endpoint Address</label>
                  <input
                    type="text"
                    value={createForm.endpoint}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="e.g. redis-slave.internal:6379"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300">IP Address</label>
                  <input
                    type="text"
                    value={createForm.ipAddress}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, ipAddress: e.target.value }))}
                    placeholder="e.g. 192.168.30.45"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-300">Access Level</label>
                  <select
                    value={createForm.accessLevel}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, accessLevel: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="public">public</option>
                    <option value="restricted">restricted</option>
                    <option value="confidential">confidential</option>
                    <option value="top_secret">top_secret</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300">Sensitivity</label>
                  <select
                    value={createForm.sensitivity}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, sensitivity: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300">Service Protocol</label>
                  <select
                    value={createForm.service}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="http">http</option>
                    <option value="dns">dns</option>
                    <option value="icmp">icmp</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300">Description</label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of resource purpose and ownership..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-2.5 text-zinc-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold shadow-sm border-blue-500/50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="surface-panel p-6 max-w-md w-full border-rose-500/50 shadow-sm border-red-500/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Access Restricted</h3>
                <p className="text-xs text-zinc-400">Firewall ACL Policy Enforcement</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-sm border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <span className="font-mono text-[10px] text-rose-400 uppercase">Enforcement Reason:</span>
              <p className="font-mono leading-relaxed text-zinc-200">{selectedLockedRes.reason}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">Submit Access Request Justification</label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Explain business justification for temporary exception access..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-sm p-3 text-xs text-zinc-100 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSelectedLockedRes(null)}
                className="px-4 py-2 rounded-sm bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendAccessRequest}
                disabled={isSubmittingReq}
                className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 text-xs font-bold transition-colors shadow-sm border-blue-500/50 cursor-pointer"
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
