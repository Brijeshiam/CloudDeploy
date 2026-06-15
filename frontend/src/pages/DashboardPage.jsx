import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Rocket,
  Activity,
  GitBranch,
  CheckCircle,
  LayoutGrid,
  FolderOpen,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import ProjectCard from '../components/ui/ProjectCard';
import StatsCard from '../components/ui/StatsCard';
import EmptyState from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useProjectStore } from '../store/projectStore';
import { useDeploymentStore } from '../store/deploymentStore';
import { useAuth } from '../hooks/useAuth';

const FILTERS = ['All', 'Active', 'Archived'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, isLoading, fetchProjects, filter, setFilter, triggerDeploy, pagination } =
    useProjectStore();
  const { triggerDeploy: deploy } = useDeploymentStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProjects({ page });
  }, [filter, page]);

  const handleDeploy = async (projectId) => {
    await deploy(projectId);
    navigate(`/projects/${projectId}`);
  };

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.githubUrl?.toLowerCase().includes(q)
    );
  });

  // Stats
  const running = projects.filter((p) => p.status === 'running').length;
  const totalDeploys = projects.reduce((acc, p) => acc + (p.deploymentCount || 0), 0);
  const successRate = totalDeploys > 0
    ? Math.round((projects.filter((p) => p.status !== 'failed').length / projects.length) * 100)
    : 100;

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            My Projects
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/projects/new" className="btn-primary">
            <Plus size={16} /> New Project
          </Link>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={<FolderOpen size={18} />}
          value={projects.length}
          label="Total Projects"
          color="#6366f1"
          index={0}
        />
        <StatsCard
          icon={<Activity size={18} />}
          value={running}
          label="Running"
          color="#10b981"
          trend={running > 0 ? 5 : 0}
          index={1}
        />
        <StatsCard
          icon={<Rocket size={18} />}
          value={totalDeploys}
          label="Total Deployments"
          color="#8b5cf6"
          index={2}
        />
        <StatsCard
          icon={<CheckCircle size={18} />}
          value={`${successRate}%`}
          label="Success Rate"
          color="#f59e0b"
          trend={successRate > 90 ? 2 : -3}
          index={3}
        />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        {/* Filter Tabs */}
        <div className="tab-list">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f.toLowerCase()); setPage(1); }}
              className={`tab-item ${filter === f.toLowerCase() || (f === 'All' && filter === 'all') ? 'active' : ''}`}
            >
              {f}
              {f === 'All' && (
                <span
                  className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}
                >
                  {projects.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="input-icon-wrapper w-full sm:w-64">
          <Search size={14} className="input-icon" />
          <input
            type="search"
            className="input input-with-icon"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading && projects.length === 0 ? (
        <PageLoader />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={32} />}
          title={search ? 'No projects match your search' : 'No projects yet'}
          description={
            search
              ? 'Try a different search term or clear the filter.'
              : 'Create your first project and deploy it to Kubernetes in minutes.'
          }
          actionLabel={search ? undefined : 'Create First Project'}
          onAction={search ? undefined : () => navigate('/projects/new')}
          actionIcon={<Plus size={16} />}
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, idx) => (
              <ProjectCard
                key={project._id}
                project={project}
                index={idx}
                onDeploy={handleDeploy}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary btn-sm"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: p === page ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: p === page ? '#818cf8' : 'var(--text-muted)',
                  border: p === page ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      )}
      {/* System Status Bar */}
      <div className="glass-card rounded-full px-6 py-4 flex items-center justify-between mt-12 shadow-[0_0_20px_rgba(82,141,255,0.05)] border border-white/10 animate-pulse-soft">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ boxShadow: '0 0 10px var(--accent-primary)', backgroundColor: 'var(--accent-primary)' }}></div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase" style={{ color: 'var(--accent-primary)' }}>All systems operational</span>
        </div>
        <span className="font-mono text-xs text-on-surface-variant opacity-60">v2.4.1-stable</span>
      </div>
    </PageLayout>
  );
}
