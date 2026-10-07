import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  ShieldAlert, ArrowLeft, Table, Database, CheckCircle, Edit3, Save, X, Plus, Trash2, 
  Lock, Eye, Shield, Server, Cloud, Globe, Wrench, Info, AlertTriangle
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
      <div className="p-12 text-center text-zinc-400 font-mono text-xs">
        Connecting to resource host and performing stateful ACL & RBAC evaluation...
      </div>
    );
  }

  // Handle Access Denied (403)
  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 surface-panel p-8 border-rose-500/60 shadow-sm border-red-500/50 text-center space-y-6">
        <div className="w-16 h-16 rounded-sm bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-zinc-100">403 Access Forbidden</h2>
          <p className="text-xs text-zinc-400 mt-1">EnterpriseNet Gateway Security & Policy Enforcement</p>
        </div>

        <div className="p-4 bg-zinc-900/90 rounded-sm border border-zinc-800 text-left font-mono text-xs space-y-2">
          <span className="text-rose-400 font-bold uppercase text-[10px]">ENFORCEMENT REASON:</span>
          <p className="text-zinc-200">{error.message || 'Access denied by policy matrix'}</p>
          {error.matchedRuleId && (
            <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
              Matched Rule ID: <span className="text-blue-500">{error.matchedRuleId}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/resources')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
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
        return <Server className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/resources')}
        className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resources Portal
      </button>

      {/* Resource Banner */}
      <div className="surface-panel p-6 border-blue-600/30 shadow-sm border-blue-500/50 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-blue-600/10 border border-blue-600/30 flex items-center justify-center shrink-0">
              {getCategoryIcon(resContent.category)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-blue-500 font-bold">
                  {resContent.ownerDepartment} DEPT
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300">
                  {resContent.accessLevel || 'CONFIDENTIAL'}
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {(resContent.category || 'resource').replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-100">{resContent.name}</h2>
              <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">{resContent.description}</p>
            </div>
          </div>

          {/* Network Endpoint & Access Status */}
          <div className="space-y-2 text-right">
            {(resContent.endpoint || resContent.ipAddress) && (
              <div className="font-mono text-xs text-blue-400 bg-zinc-950/80 px-3 py-1.5 rounded-sm border border-zinc-800 inline-block">
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
        <div className={`p-4 rounded-sm border text-xs flex flex-wrap items-center justify-between gap-3 ${
          canEdit
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {canEdit ? (
              <>
                <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong className="text-emerald-200">Write Authorized:</strong> You have edit permissions for this resource as an authorized user ({user?.role} in {effectiveDept}).</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Resource</span>
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-sm border-blue-500/50 cursor-pointer transition-colors"
              >
                {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Cancel Edit' : 'Edit Resource Data'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Permission Metadata Overview */}
      <div className="surface-panel p-5 space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase font-mono flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" /> Resource Access Control Metadata & Boundary Mapping
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-zinc-900/80 p-3 rounded-sm border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 block">ALLOWED DEPARTMENTS</span>
            <div className="flex flex-wrap gap-1">
              {allowedDepts.map((d) => (
                <span key={d} className="px-2 py-0.5 rounded bg-cyan-950 text-blue-400 border border-cyan-800 text-[10px]">
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-sm border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 block">READ ROLES</span>
            <div className="flex flex-wrap gap-1">
              {readRoles.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800 text-[10px]">
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-sm border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 block">WRITE ROLES</span>
            <div className="flex flex-wrap gap-1">
              {writeRoles.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Content & Editor */}
      <div className="surface-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-500" />
            {isEditing ? (
              <input
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-blue-600 font-mono"
              />
            ) : (
              <span>{resContent?.content?.title || 'Data Records'}</span>
            )}
          </h3>

          {isEditing && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-sm bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Add Record</span>
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold text-xs shadow-sm border-blue-500/50 cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        {editableRows.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 font-mono">No data records available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                  {Object.keys(editableRows[0] || {}).map((key) => (
                    <th key={key} className="py-3 px-4 font-semibold">{key}</th>
                  ))}
                  {isEditing && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {editableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-900/50 text-zinc-200 transition-colors">
                    {Object.entries(row).map(([key, val], cIdx) => (
                      <td key={cIdx} className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleCellChange(rIdx, key, e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-blue-600 font-mono"
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
                          className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
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

