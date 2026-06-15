import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, EyeOff, Edit2, Trash2, Lock, Unlock, RefreshCw, Save, X } from 'lucide-react';
import { envVarsAPI } from '../../services/api';
import toast from 'react-hot-toast';

function EnvRow({ envVar, onEdit, onDelete }) {
  const [showValue, setShowValue] = useState(false);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      <td className="table-cell">
        <div className="flex items-center gap-2">
          {envVar.isSecret ? (
            <Lock size={12} style={{ color: '#f59e0b' }} />
          ) : (
            <Unlock size={12} style={{ color: 'var(--text-muted)' }} />
          )}
          <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {envVar.key}
          </span>
        </div>
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {envVar.isSecret && !showValue
              ? '••••••••••••'
              : envVar.value || <span style={{ color: 'var(--text-muted)' }}>empty</span>}
          </span>
          {envVar.isSecret && (
            <button
              onClick={() => setShowValue((v) => !v)}
              className="text-xs"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showValue ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          )}
        </div>
      </td>
      <td className="table-cell">
        <span
          className={`badge ${envVar.isSecret ? 'badge-building' : 'badge-user'}`}
          style={{ fontSize: '0.65rem' }}
        >
          {envVar.isSecret ? 'Secret' : 'Plain'}
        </span>
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(envVar)} className="btn-icon btn-sm">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(envVar.key)} className="btn-icon btn-sm">
            <Trash2 size={12} style={{ color: 'var(--danger)' }} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

export default function EnvVarEditor({ projectId }) {
  const [envVars, setEnvVars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVar, setEditingVar] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(false);

  const fetchEnvVars = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await envVarsAPI.list(projectId);
      setEnvVars(res.data.envVars || []);
    } catch (err) {
      toast.error('Failed to load environment variables');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useState(() => { fetchEnvVars(); }, [fetchEnvVars]);

  const handleAdd = async () => {
    if (!newKey.trim()) { toast.error('Key is required'); return; }
    try {
      const payload = [...envVars.filter((e) => e.key !== newKey), { key: newKey.trim(), value: newValue, isSecret: newIsSecret }];
      await envVarsAPI.upsert(projectId, { envVars: payload });
      setEnvVars(payload);
      setNewKey('');
      setNewValue('');
      setNewIsSecret(false);
      setShowAddForm(false);
      toast.success('Variable saved');
    } catch {
      toast.error('Failed to save variable');
    }
  };

  const handleEdit = (envVar) => {
    setEditingVar(envVar);
    setNewKey(envVar.key);
    setNewValue(envVar.value || '');
    setNewIsSecret(envVar.isSecret);
    setShowAddForm(true);
  };

  const handleDelete = async (key) => {
    try {
      await envVarsAPI.delete(projectId, key);
      setEnvVars((prev) => prev.filter((e) => e.key !== key));
      toast.success('Variable deleted');
    } catch {
      toast.error('Failed to delete variable');
    }
  };

  const handleSyncToK8s = async () => {
    setIsSyncing(true);
    try {
      await envVarsAPI.syncToK8s(projectId);
      toast.success('Synced to Kubernetes!');
    } catch {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingVar(null);
    setNewKey('');
    setNewValue('');
    setNewIsSecret(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Environment Variables
          <span
            className="ml-2 text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            {envVars.length}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={handleSyncToK8s} className="btn-secondary btn-sm" disabled={isSyncing}>
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            Sync to K8s
          </button>
          <button onClick={() => { cancelForm(); setShowAddForm(true); }} className="btn-primary btn-sm">
            <Plus size={13} />
            Add Variable
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: '#818cf8' }}>
                {editingVar ? 'Edit Variable' : 'New Variable'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Key</label>
                  <input
                    className="input font-mono text-xs"
                    placeholder="DATABASE_URL"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                    disabled={!!editingVar}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Value</label>
                  <input
                    className="input font-mono text-xs"
                    type={newIsSecret ? 'password' : 'text'}
                    placeholder="Enter value..."
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsSecret}
                    onChange={(e) => setNewIsSecret(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Mark as secret (encrypted)
                  </span>
                  <Lock size={11} style={{ color: '#f59e0b' }} />
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={cancelForm} className="btn-secondary btn-sm">
                    <X size={12} /> Cancel
                  </button>
                  <button onClick={handleAdd} className="btn-primary btn-sm">
                    <Save size={12} /> Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        ) : envVars.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No environment variables yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {envVars.map((ev) => (
                    <EnvRow
                      key={ev.key}
                      envVar={ev}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
