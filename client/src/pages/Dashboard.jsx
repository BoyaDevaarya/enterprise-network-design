import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  FolderLock, Lock, ShieldAlert, ArrowRight, Send, Sparkles, 
  Cloud, Database, Globe, Wrench, Search, Edit3, Eye, Filter, Server, Plus, Trash2, X, Shield, Cpu
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
    { id: 'ALL', label: 'All Resources' },
    { id: 'cloud_infrastructure', label: 'Cloud Infra', icon: Cloud },
    { id: 'database_instance', label: 'Databases', icon: Database },
    { id: 'internal_web_app', label: 'Web Apps', icon: Globe },
    { id: 'network_tool', label: 'Network Tools', icon: Wrench },
  ];

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    return resources.filter(res => {
      if (selectedCategory !== 'ALL' && res.category !== selectedCategory) {
        return false;
      }
      if (selectedDeptFilter !== 'ALL' && res.ownerDepartment !== selectedDeptFilter) {
        return false;
      }
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
    if (!resources) return { total: 0, accessible: 0, writable: 0, restricted: 0 };
    const accessible = resources.filter(r => r.accessible).length;
    return {
      total: resources.length,
      accessible,
      writable: resources.filter(r => r.canEdit).length,
      restricted: resources.length - accessible
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
        return 'bg-sky-950/80 border-sky-500/40 text-sky-300';
      case 'database_instance':
        return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300';
      case 'internal_web_app':
        return 'bg-purple-950/80 border-purple-500/40 text-purple-300';
      case 'network_tool':
        return 'bg-amber-950/80 border-amber-500/40 text-amber-300';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Telemetry Summary Banner */}
      <div className="surface-panel p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30 shadow-glass">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              IDENTITY CLEARANCE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Welcome, {user?.name || user?.email}</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Active Department: <span className="font-bold text-cyan-400 font-mono">{effectiveDept}</span> | Role: <span className="font-mono text-purple-300 font-bold">{user?.role}</span>
          </p>
        </div>

        {/* Dynamic Resource Access Stat Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="surface-panel p-3 rounded-lg border-slate-800 text-center font-mono min-w-[90px]">
            <span className="text-[10px] text-slate-400 block uppercase">TOTAL</span>
            <span className="text-cyan-400 font-black text-lg">{stats.total}</span>
          </div>
          <div className="surface-panel p-3 rounded-lg border-slate-800 text-center font-mono min-w-[90px]">
            <span className="text-[10px] text-slate-400 block uppercase">READABLE</span>
            <span className="text-emerald-400 font-black text-lg">{stats.accessible}</span>
          </div>
          <div className="surface-panel p-3 rounded-lg border-slate-800 text-center font-mono min-w-[90px]">
            <span className="text-[10px] text-slate-400 block uppercase">EDITABLE</span>
            <span className="text-purple-300 font-black text-lg">{stats.writable}</span>
          </div>
          <div className="surface-panel p-3 rounded-lg border-slate-800 text-center font-mono min-w-[90px]">
            <span className="text-[10px] text-slate-400 block uppercase">BLOCKED</span>
            <span className="text-rose-400 font-black text-lg">{stats.restricted}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateForm(prev => ({ ...prev, ownerDepartment: effectiveDept }));
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Resource</span>
          </button>
        </div>
      </div>

      {/* Unified Filter & Search Toolbar */}
      <div className="surface-panel p-3.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 border-cyan-500/20 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, IP, service, or department..."
              className="w-full bg-slate-950 border border-slate-700/80 hover:border-cyan-500/40 focus:border-cyan-500 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono transition-colors shadow-inner"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <Filter className={`w-3.5 h-3.5 ${selectedDeptFilter !== 'ALL' ? 'text-cyan-400' : 'text-slate-500'}`} />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className={`bg-slate-950 border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none transition-colors cursor-pointer ${
                selectedDeptFilter !== 'ALL' ? 'border-cyan-500 text-cyan-300' : 'border-slate-700 text-slate-300 focus:border-cyan-500'
              }`}
            >
              <option value="ALL">All Departments</option>
              <option value="HR">HR Dept</option>
              <option value="Finance">Finance Dept</option>
              <option value="IT">IT Dept</option>
              <option value="Sales">Sales Dept</option>
              <option value="Management">Management</option>
              <option value="Servers">Servers Core</option>
            </select>
          </div>
        </div>

        {/* Category Pills & Reset */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
            {categoryOptions.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-colors whitespace-nowrap cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
            <FolderLock className="w-4 h-4 text-cyan-400" /> 
            Cataloged Portal Resources ({filteredResources.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-slate-400 font-mono text-xs surface-panel border-cyan-500/20">
            Evaluating zero-trust security matrix & role permissions...
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-mono text-xs surface-panel border-slate-800">
            No portal resources match the active search and filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((resObj) => {
              const isLocked = !resObj.accessible;
              const canEdit = resObj.canEdit;

              const isCritical = resObj.sensitivity === 'critical';
              const isHigh = resObj.sensitivity === 'high';

              return (
                <div
                  key={resObj.id}
                  onClick={() => handleOpenResource(resObj)}
                  className={`group surface-panel p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col min-h-[260px] relative overflow-hidden ${
                    isLocked
                      ? 'border-rose-500/30 hover:border-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                      : canEdit
                      ? 'border-emerald-500/30 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                      : 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  }`}
                >
                  {/* Top Glowing Color Stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    isLocked ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
                    canEdit ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                    'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`} />

                  {/* Header Tier */}
                  <div className="flex flex-col gap-3 mb-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border flex items-center gap-1 font-bold ${getCategoryBadgeClass(resObj.category)}`}>
                          {getCategoryIcon(resObj.category)}
                          {(resObj.category || 'resource').replace('_', ' ')}
                        </span>
                        
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          isCritical ? 'bg-rose-950 text-rose-300 border border-rose-500' :
                          isHigh ? 'bg-amber-950 text-amber-300 border border-amber-500' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {resObj.sensitivity || 'NORMAL'}
                        </span>

                        {resObj.accessLevel === 'top_secret' && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-600 font-extrabold uppercase animate-pulse">
                            TOP SECRET
                          </span>
                        )}
                      </div>

                      {/* Read / Write Status & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500 text-rose-300 font-bold">
                            <Lock className="w-3 h-3" />
                            BLOCKED
                          </span>
                        ) : canEdit ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold">
                            <Edit3 className="w-3 h-3" />
                            READ/WRITE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500 text-cyan-300 font-bold">
                            <Eye className="w-3 h-3" />
                            READ ONLY
                          </span>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteResource(e, resObj)}
                            title="Delete Resource"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Endpoint */}
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center justify-between mb-1.5 group-hover:text-cyan-300 transition-colors">
                        <span className="line-clamp-1">{resObj.name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-2" title="Cluster Host: ONLINE" />
                      </h4>
                      
                      {(resObj.endpoint || resObj.ipAddress) && (
                        <div className="font-mono text-[11px] text-cyan-300 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 break-all">
                          {resObj.endpoint || resObj.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 leading-relaxed overflow-hidden">
                      {resObj.description}
                    </p>
                  </div>

                  {/* Footer Bar */}
                  <div className="pt-3 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        DEPT: {resObj.ownerDepartment}
                      </span>
                    </div>

                    <span className={`flex items-center gap-1.5 font-bold text-xs transition-transform group-hover:translate-x-1 ${
                      isLocked ? 'text-rose-400' : canEdit ? 'text-emerald-400' : 'text-cyan-400'
                    }`}>
                      <span>{isLocked ? 'Request Access' : canEdit ? 'Open & Edit' : 'View Content'}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="surface-panel p-6 max-w-lg w-full border-cyan-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto bg-slate-900/95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" /> Create New Portal Resource
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResourceSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Resource Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Production Redis Secondary Cluster"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="cloud_infrastructure">Cloud Infrastructure</option>
                    <option value="database_instance">Database Instance</option>
                    <option value="internal_web_app">Internal Web Application</option>
                    <option value="network_tool">Network Tool</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Owner Department</label>
                  <select
                    value={createForm.ownerDepartment}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, ownerDepartment: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
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
                  <label className="text-slate-300 font-bold">Endpoint Address</label>
                  <input
                    type="text"
                    value={createForm.endpoint}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="e.g. redis-slave.internal:6379"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">IP Address</label>
                  <input
                    type="text"
                    value={createForm.ipAddress}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, ipAddress: e.target.value }))}
                    placeholder="e.g. 192.168.30.45"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Access Level</label>
                  <select
                    value={createForm.accessLevel}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, accessLevel: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="public">public</option>
                    <option value="restricted">restricted</option>
                    <option value="confidential">confidential</option>
                    <option value="top_secret">top_secret</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Sensitivity</label>
                  <select
                    value={createForm.sensitivity}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, sensitivity: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Service</label>
                  <select
                    value={createForm.service}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="http">http</option>
                    <option value="dns">dns</option>
                    <option value="icmp">icmp</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Description</label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of resource purpose and ownership..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  {isCreating ? 'Creating...' : 'Confirm Creation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Restricted Modal */}
      {selectedLockedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="surface-panel p-6 max-w-md w-full border-rose-500/50 shadow-2xl space-y-4 bg-slate-900/95">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Access Restricted</h3>
                <p className="text-xs text-slate-400 font-mono">Firewall ACL Policy Block</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5 font-mono">
              <span className="text-[10px] text-rose-400 uppercase font-bold">Enforcement Rule Trigger:</span>
              <p className="leading-relaxed text-slate-200">{selectedLockedRes.reason}</p>
            </div>

            <div className="space-y-2 font-mono">
              <label className="block text-xs font-bold text-slate-300">Submit Access Request Justification</label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Explain business justification for emergency or cross-department access..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSelectedLockedRes(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAccessRequest}
                disabled={isSubmittingReq}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
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
