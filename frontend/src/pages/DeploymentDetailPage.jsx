import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  GitCommit,
  Tag,
  User,
  RotateCcw,
  StopCircle,
  AlertTriangle,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import PageLayout from '../components/layout/PageLayout';
import DeploymentTimeline from '../components/ui/DeploymentTimeline';
import LogViewer from '../components/ui/LogViewer';
import StatusBadge from '../components/ui/StatusBadge';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useDeploymentStore } from '../store/deploymentStore';
import { useProjectStore } from '../store/projectStore';

function DeploymentVisual({ status }) {
  const isActive = ['building', 'pushing', 'deploying', 'queued'].includes(status);
  
  let color = 'var(--accent-primary)';
  let label = 'Active';
  let percentage = '0%';

  if (status === 'queued') {
    label = 'QUEUED';
    color = '#3b82f6';
    percentage = '10%';
  } else if (status === 'building') {
    label = 'BUILDING';
    color = 'var(--accent-primary)';
    percentage = '45%';
  } else if (status === 'pushing') {
    label = 'PUSHING';
    color = 'var(--accent-secondary)';
    percentage = '75%';
  } else if (status === 'deploying') {
    label = 'DEPLOYING';
    color = '#97cee7';
    percentage = '90%';
  } else if (status === 'running') {
    label = 'RUNNING';
    color = '#10b981';
    percentage = '100%';
  } else if (status === 'failed') {
    label = 'FAILED';
    color = '#ffb4ab';
    percentage = 'ERR';
  } else if (status === 'stopped') {
    label = 'STOPPED';
    color = '#8c909f';
    percentage = 'STOP';
  }

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[240px] border border-white/10 shadow-[0_0_40px_rgba(82,141,255,0.05)]">
      {/* Immersive radial glows */}
      <div 
        className="absolute w-32 h-32 rounded-full blur-[50px] opacity-20 transition-all duration-700 pointer-events-none" 
        style={{ backgroundColor: color }}
      />
      
      {/* Rotating concentric rings */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Outer dashed ring */}
        <svg className="absolute w-full h-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="rgba(255, 255, 255, 0.03)" 
            strokeWidth="2" 
            fill="transparent" 
          />
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke={color} 
            strokeWidth="2.5" 
            strokeDasharray="14 8" 
            strokeLinecap="round"
            fill="transparent" 
            opacity="0.8"
          />
        </svg>

        {/* Inner rotating solid ring */}
        <svg className={`absolute w-[80%] h-[80%] ${isActive ? 'animate-[spin_4s_linear_infinite_reverse]' : ''}`} viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeDasharray="15 30 60 20" 
            fill="transparent" 
            opacity="0.4"
          />
        </svg>

        {/* Status Text overlay */}
        <div className="absolute flex flex-col items-center justify-center text-center z-10">
          <span className="text-[9px] font-mono tracking-widest uppercase opacity-75" style={{ color }}>{label}</span>
          <span className="text-2xl font-extrabold tracking-tight text-on-surface mt-1">{percentage}</span>
          {isActive && (
            <div className="flex gap-1 mt-1.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-ping" style={{ backgroundColor: color }} />
              <span className="w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: color }} />
              <span className="w-1 h-1 rounded-full opacity-20" style={{ backgroundColor: color }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeploymentDetailPage() {
  const { id: projectId, depId } = useParams();
  const { currentDeployment, fetchDeployment, isLoading, rollbackDeployment, stopDeployment } =
    useDeploymentStore();
  const { currentProject, fetchProject } = useProjectStore();

  useEffect(() => {
    fetchDeployment(projectId, depId);
    fetchProject(projectId);
  }, [projectId, depId]);

  const dep = currentDeployment;

  const duration = dep?.createdAt && dep?.completedAt
    ? differenceInSeconds(new Date(dep.completedAt), new Date(dep.createdAt))
    : null;

  const handleRollback = async () => {
    await rollbackDeployment(projectId, depId);
  };

  const handleStop = async () => {
    await stopDeployment(projectId, depId);
  };

  if (isLoading && !dep) return <PageLayout><PageLoader /></PageLayout>;

  if (!dep) return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center min-h-60 gap-4 text-center">
        <AlertTriangle size={40} style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Deployment not found</p>
        <Link to={`/projects/${projectId}`} className="btn-secondary btn-sm">← Back to Project</Link>
      </div>
    </PageLayout>
  );

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-sm mb-6 flex-wrap"
        style={{ color: 'var(--text-muted)' }}
      >
        <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <ChevronRight size={14} />
        <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">
          {currentProject?.name || 'Project'}
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)' }}>
          Deployment #{depId?.slice(-6)}
        </span>
      </motion.div>

      <div className="max-w-4xl flex flex-col gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Deployment #{depId?.slice(-6)}
              </h1>
              <StatusBadge status={dep.status} />
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {dep.createdAt
                ? `Triggered ${formatDistanceToNow(new Date(dep.createdAt), { addSuffix: true })}`
                : '—'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['building', 'pushing', 'deploying'].includes(dep.status) && (
              <button onClick={handleStop} className="btn-secondary btn-sm">
                <StopCircle size={14} /> Stop
              </button>
            )}
            {dep.status === 'running' && (
              <button onClick={handleRollback} className="btn-secondary btn-sm">
                <RotateCcw size={14} /> Rollback
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            {
              icon: <Clock size={14} />,
              label: 'Duration',
              value: duration !== null ? `${duration}s` : '—',
              color: '#6366f1',
            },
            {
              icon: <User size={14} />,
              label: 'Triggered By',
              value: dep.triggeredBy || 'Manual',
              color: '#8b5cf6',
            },
            {
              icon: <GitCommit size={14} />,
              label: 'Commit SHA',
              value: dep.commitSha?.slice(0, 7) || '—',
              color: '#3b82f6',
              mono: true,
            },
            {
              icon: <Tag size={14} />,
              label: 'Image Tag',
              value: dep.imageTag || '—',
              color: '#10b981',
              mono: true,
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: stat.color }}>{stat.icon}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
              </div>
              <p
                className={`text-sm font-semibold ${stat.mono ? 'font-mono' : ''}`}
                style={{ color: 'var(--text-primary)' }}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Visual progress stepper grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-1">
            <DeploymentVisual status={dep.status} />
          </div>
          <div className="md:col-span-2 rounded-xl p-6 glass-card border border-white/10 flex flex-col gap-4">
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Pipeline Progress
            </h2>
            <DeploymentTimeline deployment={dep} />
          </div>
        </motion.div>

        {/* Commit Info */}
        {(dep.commitMessage || dep.commitSha || dep.author) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl p-5 flex flex-col gap-2"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>COMMIT</p>
            <div className="flex items-start gap-3">
              <GitCommit size={16} style={{ color: '#6366f1', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {dep.commitMessage || 'No message'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {dep.commitSha && (
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {dep.commitSha.slice(0, 12)}
                    </span>
                  )}
                  {dep.author && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      by {dep.author}
                    </span>
                  )}
                  {dep.createdAt && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(dep.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Build Logs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <LogViewer
            deploymentId={depId}
            projectId={projectId}
            title={`Build Logs — #${depId?.slice(-6)}`}
            maxHeight={550}
          />
        </motion.div>
      </div>
    </PageLayout>
  );
}
