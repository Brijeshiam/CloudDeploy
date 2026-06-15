import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Rocket,
  Server,
  Activity,
  Shield,
  Trash2,
  ChevronDown,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import PageLayout from '../components/layout/PageLayout';
import StatsCard from '../components/ui/StatsCard';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmModal from '../components/ui/ConfirmModal';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['Users', 'Deployments', 'System'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('Users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [clusterHealth, setClusterHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, userId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, deploymentsRes, healthRes] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.listUsers(),
        adminAPI.listAllDeployments({ limit: 20 }),
        adminAPI.getClusterHealth(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || []);
      if (deploymentsRes.status === 'fulfilled') setDeployments(deploymentsRes.value.data.deployments || []);
      if (healthRes.status === 'fulfilled') setClusterHealth(healthRes.value.data);
    } catch (err) {
      // Fallback mock data for demo
      setStats({ totalUsers: 12, totalProjects: 34, totalDeployments: 156, runningPods: 8 });
      setUsers(MOCK_USERS);
      setDeployments(MOCK_DEPLOYMENTS);
      setClusterHealth({ status: 'healthy', nodes: 3, pods: 8 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.userId) return;
    setIsDeleting(true);
    try {
      await adminAPI.deleteUser(deleteModal.userId);
      setUsers((prev) => prev.filter((u) => u._id !== deleteModal.userId));
      toast.success('User deleted');
      setDeleteModal({ open: false, userId: null });
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  if (isLoading) return <PageLayout><PageLoader /></PageLayout>;

  return (
    <PageLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <Shield size={17} style={{ color: '#f59e0b' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
          </div>
          <p className="text-sm mt-1 ml-12" style={{ color: 'var(--text-muted)' }}>
            Manage users, deployments, and system settings
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </motion.div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={<Users size={18} />} value={stats.totalUsers} label="Total Users" color="#6366f1" index={0} />
          <StatsCard icon={<Server size={18} />} value={stats.totalProjects} label="Total Projects" color="#8b5cf6" index={1} />
          <StatsCard icon={<Rocket size={18} />} value={stats.totalDeployments} label="Total Deployments" color="#3b82f6" index={2} />
          <StatsCard icon={<Activity size={18} />} value={stats.runningPods} label="Running Pods" color="#10b981" index={3} />
        </div>
      )}

      {/* Tabs */}
      <div className="tab-list mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
          >
            {tab === 'Users' && <Users size={14} />}
            {tab === 'Deployments' && <Rocket size={14} />}
            {tab === 'System' && <Database size={14} />}
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* ─── USERS TAB ─── */}
          {activeTab === 'Users' && (
            <div className="flex flex-col gap-4">
              <div className="input-icon-wrapper w-72">
                <Search size={14} className="input-icon" />
                <input
                  type="search"
                  className="input input-with-icon"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Projects</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                            No users found
                          </td>
                        </tr>
                      ) : filteredUsers.map((user, idx) => (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                        >
                          <td>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                              >
                                {user.name?.slice(0, 2).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <select
                              className="input text-xs py-1 px-2"
                              style={{ width: 'auto' }}
                              value={user.role}
                              onChange={(e) => handleChangeRole(user._id, e.target.value)}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {user.createdAt
                                ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                                : '—'}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {user.projectCount ?? 0}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setDeleteModal({ open: true, userId: user._id })}
                              className="btn-icon btn-sm"
                              title="Delete user"
                            >
                              <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── DEPLOYMENTS TAB ─── */}
          {activeTab === 'Deployments' && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Project</th>
                      <th>User</th>
                      <th>Status</th>
                      <th>Triggered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                          No deployments found
                        </td>
                      </tr>
                    ) : deployments.map((dep, idx) => (
                      <motion.tr
                        key={dep._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <td>
                          <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                            #{dep._id?.slice(-6)}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {dep.projectName || dep.project?.name || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {dep.userName || dep.user?.name || '—'}
                          </span>
                        </td>
                        <td><StatusBadge status={dep.status} /></td>
                        <td>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {dep.createdAt ? formatDistanceToNow(new Date(dep.createdAt), { addSuffix: true }) : '—'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── SYSTEM TAB ─── */}
          {activeTab === 'System' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Cluster Health */}
              <div
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Cluster Health
                </h3>
                {clusterHealth ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {clusterHealth.status === 'healthy' ? (
                        <CheckCircle size={20} style={{ color: '#10b981' }} />
                      ) : (
                        <XCircle size={20} style={{ color: '#ef4444' }} />
                      )}
                      <span
                        className="text-lg font-bold capitalize"
                        style={{ color: clusterHealth.status === 'healthy' ? '#10b981' : '#ef4444' }}
                      >
                        {clusterHealth.status}
                      </span>
                    </div>
                    {[
                      { label: 'Nodes', value: clusterHealth.nodes || '—' },
                      { label: 'Running Pods', value: clusterHealth.pods || '—' },
                      { label: 'Namespace', value: clusterHealth.namespace || 'clouddeploy' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Health data unavailable</p>
                )}
              </div>

              {/* System Info */}
              <div
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  System Info
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Platform', value: 'CloudDeploy v1.0' },
                    { label: 'Kubernetes', value: clusterHealth?.kubeVersion || '1.28+' },
                    { label: 'Container Runtime', value: 'containerd' },
                    { label: 'Registry', value: 'registry.clouddeploy.io' },
                    { label: 'Region', value: 'us-east-1' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteModal.open}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteModal({ open: false, userId: null })}
        title="Delete User"
        message="Are you sure you want to delete this user? All their projects and deployments will be permanently removed."
        confirmLabel="Delete User"
        danger
        isLoading={isDeleting}
      />
    </PageLayout>
  );
}

// Mock data for demo when API is not available
const MOCK_USERS = [
  { _id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), projectCount: 5 },
  { _id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'user', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), projectCount: 2 },
  { _id: '3', name: 'Carol White', email: 'carol@example.com', role: 'user', createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), projectCount: 7 },
];

const MOCK_DEPLOYMENTS = [
  { _id: 'dep001xyz', projectName: 'my-api', userName: 'Alice Johnson', status: 'running', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: 'dep002abc', projectName: 'frontend-app', userName: 'Bob Smith', status: 'building', createdAt: new Date(Date.now() - 600000).toISOString() },
  { _id: 'dep003def', projectName: 'auth-service', userName: 'Carol White', status: 'failed', createdAt: new Date(Date.now() - 7200000).toISOString() },
];
