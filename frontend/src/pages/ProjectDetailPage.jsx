import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Square,
  RefreshCw,
  Copy,
  ExternalLink,
  Globe,
  GitBranch,
  RotateCcw,
  Trash2,
  Archive,
  Save,
  AlertTriangle,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PageLayout from '../components/layout/PageLayout';
import Sidebar from '../components/layout/Sidebar';
import StatusBadge from '../components/ui/StatusBadge';
import PodStatusGrid from '../components/ui/PodStatusGrid';
import MetricsChart from '../components/ui/MetricsChart';
import LogViewer from '../components/ui/LogViewer';
import EnvVarEditor from '../components/ui/EnvVarEditor';
import DeploymentTimeline from '../components/ui/DeploymentTimeline';
import ConfirmModal from '../components/ui/ConfirmModal';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useProjectStore } from '../store/projectStore';
import { useDeploymentStore } from '../store/deploymentStore';
import { projectsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteModal, setDeleteModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: '', branch: '', port: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  const { currentProject, fetchProject, isLoading, deleteProject, archiveProject } =
    useProjectStore();
  const { deployments, fetchDeployments, triggerDeploy, isLoading: deployLoading } =
    useDeploymentStore();

  useEffect(() => {
    fetchProject(id);
    fetchDeployments(id);
  }, [id]);

  useEffect(() => {
    if (currentProject) {
      setSettingsForm({
        name: currentProject.name || '',
        branch: currentProject.branch || 'main',
        port: String(currentProject.port || 3000),
      });
    }
  }, [currentProject]);

  const handleDeploy = async () => {
    const result = await triggerDeploy(id);
    if (result.success) {
      navigate(`/projects/${id}/deployments/${result.deployment._id}`);
    }
  };

  const handleStop = async () => {
    try {
      await projectsAPI.stop(id);
      toast.success('Project stopped');
      fetchProject(id);
    } catch {
      toast.error('Failed to stop');
    }
  };

  const handleRestart = async () => {
    try {
      await projectsAPI.restart(id);
      toast.success('Restart initiated');
    } catch {
      toast.error('Failed to restart');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProject(id);
    setIsDeleting(false);
    if (result.success) navigate('/dashboard');
  };

  const handleArchive = async () => {
    const result = await archiveProject(id);
    if (result.success) {
      setArchiveModal(false);
      fetchProject(id);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await projectsAPI.update(id, { ...settingsForm, port: parseInt(settingsForm.port) });
      toast.success('Settings saved!');
      fetchProject(id);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCopyUrl = () => {
    const url = currentProject?.serviceUrl || currentProject?.externalUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('URL copied!');
    }
  };

  if (isLoading && !currentProject) return <PageLayout><PageLoader /></PageLayout>;
  if (!currentProject) return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center min-h-60 gap-4">
        <AlertTriangle size={40} style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Project not found</p>
        <Link to="/dashboard" className="btn-secondary">← Back to Dashboard</Link>
      </div>
    </PageLayout>
  );

  const recentDeployments = deployments.slice(0, 3);
  const projectUrl = currentProject.serviceUrl || currentProject.externalUrl;

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)' }}>{currentProject.name}</span>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <Sidebar
          project={currentProject}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Project Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {currentProject.name}
                </h1>
                <StatusBadge status={currentProject.latestDeployment?.status || currentProject.status} />
              </div>
              {currentProject.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {currentProject.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleRestart}
                className="btn-secondary btn-sm"
                title="Restart"
              >
                <RefreshCw size={14} /> Restart
              </button>
              {(currentProject.latestDeployment?.status === 'running' || currentProject.latestDeployment?.status === 'active') && (
                <button onClick={handleStop} className="btn-secondary btn-sm">
                  <Square size={14} /> Stop
                </button>
              )}
              <button
                onClick={handleDeploy}
                className="btn-primary btn-sm"
                disabled={deployLoading}
              >
                <Rocket size={14} /> Deploy
              </button>
            </div>
          </motion.div>

          {/* Mobile tab selector */}
          <div className="lg:hidden mb-4 overflow-x-auto">
            <div className="tab-list w-max min-w-full">
              {['overview', 'deployments', 'logs', 'env', 'settings'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`tab-item ${activeTab === t ? 'active' : ''}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* ─── OVERVIEW ─── */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-6">
                  {/* Project URL */}
                  {projectUrl && (
                    <div
                      className="rounded-xl p-4 flex items-center justify-between gap-3"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                          <Globe size={15} style={{ color: '#10b981' }} />
                        </div>
                        <a
                          href={projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm truncate hover:opacity-80 transition-opacity"
                          style={{ color: '#34d399' }}
                        >
                          {projectUrl}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={handleCopyUrl} className="btn-icon btn-sm" title="Copy URL">
                          {copied ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                        </button>
                        <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="btn-icon btn-sm">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Pods */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <PodStatusGrid projectId={id} />
                  </div>

                  {/* Metrics */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <MetricsChart projectId={id} />
                  </div>

                  {/* Recent Deployments */}
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="flex items-center justify-between px-5 py-4"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Recent Deployments
                      </h3>
                      <button onClick={() => setActiveTab('deployments')} className="btn-secondary btn-sm">
                        View all
                      </button>
                    </div>
                    <div className="divide-y" style={{ '--tw-divide-color': 'rgba(255,255,255,0.04)' }}>
                      {recentDeployments.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                          No deployments yet
                        </p>
                      ) : recentDeployments.map((dep) => (
                        <Link
                          key={dep._id}
                          to={`/projects/${id}/deployments/${dep._id}`}
                          className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <StatusBadge status={dep.status} />
                            <div>
                              <p className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                                #{dep._id?.slice(-6) || 'N/A'}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {dep.commitMessage || 'Manual trigger'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {dep.createdAt ? formatDistanceToNow(new Date(dep.createdAt), { addSuffix: true }) : '—'}
                            </span>
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── DEPLOYMENTS ─── */}
              {activeTab === 'deployments' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Deployments</h2>
                    <button onClick={handleDeploy} className="btn-primary btn-sm" disabled={deployLoading}>
                      <Rocket size={13} /> Trigger Deploy
                    </button>
                  </div>
                  {deployments.length === 0 ? (
                    <div
                      className="rounded-xl p-10 text-center"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <Rocket size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                      <p style={{ color: 'var(--text-muted)' }}>No deployments yet. Trigger your first deploy!</p>
                    </div>
                  ) : deployments.map((dep, idx) => (
                    <motion.div
                      key={dep._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-xl overflow-hidden"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={dep.status} />
                          <div>
                            <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                              #{dep._id?.slice(-6)}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {dep.createdAt ? formatDistanceToNow(new Date(dep.createdAt), { addSuffix: true }) : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/projects/${id}/deployments/${dep._id}`}
                            className="btn-secondary btn-sm"
                          >
                            View Logs
                          </Link>
                          {dep.status === 'running' && (
                            <button className="btn-secondary btn-sm">
                              <RotateCcw size={13} /> Rollback
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <DeploymentTimeline deployment={dep} compact />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ─── LOGS ─── */}
              {activeTab === 'logs' && (
                <LogViewer
                  projectId={id}
                  deploymentId={deployments[0]?._id}
                  title={`${currentProject.name} — Runtime Logs`}
                  maxHeight={600}
                />
              )}

              {/* ─── ENVIRONMENT ─── */}
              {activeTab === 'env' && <EnvVarEditor projectId={id} />}

              {/* ─── SETTINGS ─── */}
              {activeTab === 'settings' && (
                <div className="flex flex-col gap-6 max-w-lg">
                  {/* General Settings */}
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>General</h3>
                    </div>
                    <div className="px-5 py-5 flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          Project Name
                        </label>
                        <input
                          className="input"
                          value={settingsForm.name}
                          onChange={(e) => setSettingsForm((p) => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          Default Branch
                        </label>
                        <input
                          className="input font-mono"
                          value={settingsForm.branch}
                          onChange={(e) => setSettingsForm((p) => ({ ...p, branch: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          Application Port
                        </label>
                        <input
                          className="input font-mono"
                          type="number"
                          value={settingsForm.port}
                          onChange={(e) => setSettingsForm((p) => ({ ...p, port: e.target.value }))}
                        />
                      </div>
                      <button onClick={handleSaveSettings} className="btn-primary btn-sm w-fit" disabled={isSavingSettings}>
                        {isSavingSettings ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          <><Save size={13} /> Save Changes</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <div
                      className="px-5 py-4"
                      style={{ background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}
                    >
                      <h3 className="text-sm font-semibold" style={{ color: '#ef4444' }}>Danger Zone</h3>
                    </div>
                    <div className="px-5 py-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Archive Project</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Suspend deployments without deleting data</p>
                        </div>
                        <button onClick={() => setArchiveModal(true)} className="btn-secondary btn-sm">
                          <Archive size={13} /> Archive
                        </button>
                      </div>
                      <div className="flex items-center justify-between" style={{ paddingTop: 12, borderTop: '1px solid rgba(239,68,68,0.1)' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Delete Project</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Permanently remove this project and all its data</p>
                        </div>
                        <button onClick={() => setDeleteModal(true)} className="btn-danger btn-sm">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={deleteModal}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${currentProject.name}"? This will stop all running pods, remove all deployments, and delete all associated data. This action cannot be undone.`}
        confirmLabel="Delete Forever"
        danger
        isLoading={isDeleting}
      />
      <ConfirmModal
        isOpen={archiveModal}
        onConfirm={handleArchive}
        onCancel={() => setArchiveModal(false)}
        title="Archive Project"
        message={`Archive "${currentProject.name}"? This will stop all deployments. You can unarchive it later.`}
        confirmLabel="Archive"
        danger={false}
      />
    </PageLayout>
  );
}

function CheckCircle({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
