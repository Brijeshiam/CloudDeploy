import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Clock,
  Boxes,
  Rocket,
  Eye,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import StatusBadge from './StatusBadge';

export default function ProjectCard({ project, index = 0, onDeploy }) {
  const lastDeployedAt = project.lastDeployedAt
    ? formatDistanceToNow(new Date(project.lastDeployedAt), { addSuffix: true })
    : 'Never';

  const truncateUrl = (url) => {
    if (!url) return '—';
    return url.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\.git$/, '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="glass glass-hover rounded-xl p-5 flex flex-col gap-4 cursor-pointer group"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{
              background: `linear-gradient(135deg, ${getProjectColor(project.name)})`,
            }}
          >
            {project.name?.slice(0, 2).toUpperCase() || 'PR'}
          </div>
          <div>
            <Link
              to={`/projects/${project._id}`}
              className="font-semibold text-sm hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-primary)' }}
            >
              {project.name}
            </Link>
            {project.description && (
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                {project.description}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={project.latestDeployment?.status || project.status} />
      </div>

      {/* GitHub Info */}
      <div className="flex flex-col gap-2">
        {project.githubUrl && (
          <div className="flex items-center gap-2">
            <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:opacity-80 transition-opacity truncate"
              style={{ color: 'var(--text-secondary)' }}
              title={project.githubUrl}
            >
              {truncateUrl(project.githubUrl)}
            </a>
          </div>
        )}
        <div className="flex items-center gap-2">
          <GitBranch size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {project.branch || 'main'}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div
        className="flex items-center justify-between py-3 px-1"
        style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
      >
        <StatItem icon={<Clock size={12} />} label={lastDeployedAt} />
        <StatItem
          icon={<Boxes size={12} />}
          label={`${project.podCount ?? 0} pod${project.podCount !== 1 ? 's' : ''}`}
        />
        <StatItem
          icon={<Rocket size={12} />}
          label={`${project.deploymentCount ?? 0} deploys`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.preventDefault();
            onDeploy && onDeploy(project._id);
          }}
          className="btn-primary btn-sm flex-1"
          disabled={['building', 'pushing', 'deploying', 'queued'].includes(project.latestDeployment?.status)}
        >
          <Rocket size={13} />
          Deploy
        </motion.button>
        <Link to={`/projects/${project._id}`} className="btn-secondary btn-sm flex-1">
          <Eye size={13} />
          View
        </Link>
        <button className="btn-icon btn-sm">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function StatItem({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

function getProjectColor(name = '') {
  const colors = [
    '#6366f1, #8b5cf6',
    '#3b82f6, #6366f1',
    '#8b5cf6, #a855f7',
    '#06b6d4, #3b82f6',
    '#10b981, #3b82f6',
    '#f59e0b, #ef4444',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}
