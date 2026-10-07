import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  ShieldAlert, ArrowLeft, Table, Database, CheckCircle, Edit3, Save, X, Plus, Trash2, 
  Lock, Eye, Shield, Server, Cloud, Globe, Wrench, Info, AlertTriangle, Cpu, Radio
} from 'lucide-react';
import { toast } from 'sonner';

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { previewDept, user } = useAuthStore();
  const effectiveDept = previewDept || user?.department || 'IT';

  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableRows, setEditableRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: resContent, isLoading, error } = useQuery({
    queryKey: ['resource-content', id, effectiveDept],
    queryFn: () => apiRequest(`/api/resources/${id}/content`),
    retry: false
  });

  useEffect(() => {
    if (resContent?.content) {
      setEditableTitle(resContent.content.title || '');
      setEditableRows(resContent.content.table || []);
    }
  }, [resContent]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-xs surface-panel border-cyan-500/20">
        Connecting to resource cluster host and performing stateful ACL & RBAC evaluation...
      </div>
    );
  }

  // Handle Access Denied (403)
  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 surface-panel p-8 border-rose-500/60 shadow-2xl text-center space-y-6 bg-slate-950/90">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center justify-center mx-auto animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">403 Access Forbidden</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">EnterpriseNet Gateway Security & Policy Enforcement</p>
        </div>

        <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 text-left font-mono text-xs space-y-2">
          <span className="text-rose-400 font-bold uppercase text-[10px]">ENFORCEMENT REASON:</span>
          <p className="text-slate-200">{error.message || 'Access denied by policy matrix'}</p>
          {error.matchedRuleId && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Matched Rule ID: <span className="text-cyan-400 font-bold">{error.matchedRuleId}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/resources')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Resources Portal
        </button>
      </div>
    );
  }

  const canEdit = resContent?.canEdit;
  const permissions = resContent?.permissions || {};
  const allowedDepts = permissions.allowedDepartments || [];
  const readRoles = permissions.readRoles || [];
  const writeRoles = permissions.writeRoles || [];

  const handleCellChange = (rowIndex, colKey, value) => {
    setEditableRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [colKey]: value };
      return updated;
    });
  };

  const handleAddRow = () => {
    if (editableRows.length === 0) return;
    const templateRow = editableRows[0];
    const newRow = {};
    Object.keys(templateRow).forEach((key) => {
      newRow[key] = 'New Value';
    });
    setEditableRows((prev) => [...prev, newRow]);
  };

  const handleRemoveRow = (idx) => {
    setEditableRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      await apiRequest(`/api/resources/${id}/content`, {
        method: 'PUT',
        body: JSON.stringify({
          content: {
            title: editableTitle,
            table: editableRows
          }
        })
      });
      toast.success('Resource content successfully saved and synced');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['resource-content', id] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    } catch (err) {
      toast.error('Save failed', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'cloud_infrastructure':
        return <Cloud className="w-5 h-5 text-sky-400" />;
      case 'database_instance':
        return <Database className="w-5 h-5 text-emerald-400" />;
      case 'internal_web_app':
        return <Globe className="w-5 h-5 text-purple-400" />;
      case 'network_tool':
        return <Wrench className="w-5 h-5 text-amber-400" />;
      default:
        return <Server className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/resources')}
        className="inline-flex items-center gap-2 text-xs font-mono font-medium text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resources Portal
      </button>

      {/* Resource Banner */}
      <div className="surface-panel p-6 border-cyan-500/30 shadow-glass space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              {getCategoryIcon(resContent.category)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-slate-950 border border-cyan-500/30 text-cyan-300 font-bold">
                  {resContent.ownerDepartment} DEPT
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {resContent.accessLevel || 'CONFIDENTIAL'}
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  {(resContent.category || 'resource').replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{resContent.name}</h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{resContent.description}</p>
            </div>
          </div>

          {/* Network Endpoint & Access Status */}
          <div className="space-y-2 text-right">
            {(resContent.endpoint || resContent.ipAddress) && (
              <div className="font-mono text-xs text-cyan-300 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 inline-block shadow-inner">
                {resContent.endpoint || resContent.ipAddress}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 text-xs font-mono">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">READ AUTHORIZED ({effectiveDept})</span>
            </div>
          </div>
        </div>

        {/* Read / Write Authorization Status Banner */}
        <div className={`p-4 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-3 font-mono ${
          canEdit
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {canEdit ? (
              <>
                <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong className="text-emerald-200">Write Authorized:</strong> You have edit permissions for this resource as an authorized operator ({user?.role} in {effectiveDept}).</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong className="text-amber-200">Read-Only Mode:</strong> {resContent.writeReason || 'Write access restricted by RBAC matrix.'}</span>
              </>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete '${resContent.name}'?`)) {
                    try {
                      await apiRequest(`/api/resources/${id}`, { method: 'DELETE' });
                      toast.success(`Resource '${resContent.name}' deleted`);
                      queryClient.invalidateQueries({ queryKey: ['resources'] });
                      navigate('/resources');
                    } catch (err) {
                      toast.error('Failed to delete resource', { description: err.message });
                    }
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Resource</span>
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-colors"
              >
                {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Cancel Edit' : 'Edit Resource Data'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Permission Metadata Overview */}
      <div className="surface-panel p-5 space-y-3 border-slate-800 shadow-xl">
        <h3 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" /> Resource Access Control Metadata & Policy Boundaries
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">ALLOWED DEPARTMENTS</span>
            <div className="flex flex-wrap gap-1">
              {allowedDepts.map((d) => (
                <span key={d} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">READ ROLES</span>
            <div className="flex flex-wrap gap-1">
              {readRoles.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 text-[10px]">
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">WRITE ROLES</span>
            <div className="flex flex-wrap gap-1">
              {writeRoles.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Content & Editor */}
      <div className="surface-panel p-6 space-y-4 border-cyan-500/20 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
            <Table className="w-4 h-4 text-cyan-400" />
            {isEditing ? (
              <input
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            ) : (
              <span>{resContent?.content?.title || 'Data Records Ledger'}</span>
            )}
          </h3>

          {isEditing && (
            <div className="flex items-center gap-2 font-mono">
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Record</span>
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        {editableRows.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 font-mono">No data records available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] bg-slate-950/60">
                  {Object.keys(editableRows[0] || {}).map((key) => (
                    <th key={key} className="py-3 px-4 font-bold">{key}</th>
                  ))}
                  {isEditing && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {editableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/60 text-slate-200 transition-colors">
                    {Object.entries(row).map(([key, val], cIdx) => (
                      <td key={cIdx} className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleCellChange(rIdx, key, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        ) : (
                          <span>{String(val)}</span>
                        )}
                      </td>
                    ))}
                    {isEditing && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(rIdx)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
