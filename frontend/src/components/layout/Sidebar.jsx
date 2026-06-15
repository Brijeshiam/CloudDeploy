import { motion } from 'framer-motion';
import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  Terminal,
  KeyRound,
  Settings,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const navItems = [
  { label: 'Overview', tab: 'overview', icon: <LayoutDashboard size={16} /> },
  { label: 'Deployments', tab: 'deployments', icon: <GitBranch size={16} /> },
  { label: 'Logs', tab: 'logs', icon: <Terminal size={16} /> },
  { label: 'Environment', tab: 'env', icon: <KeyRound size={16} /> },
  { label: 'Settings', tab: 'settings', icon: <Settings size={16} /> },
];

export default function Sidebar({ project, activeTab, onTabChange }) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-64 shrink-0 hidden lg:block"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      <div
        className="sticky top-20 rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Project Header */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              {project?.name?.slice(0, 2).toUpperCase() || 'PR'}
            </div>
            <div className="min-w-0">
              <p
                className="font-semibold text-sm truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {project?.name || 'Project'}
              </p>
              <div className="mt-1.5">
                <StatusBadge status={project?.status || 'stopped'} />
              </div>
            </div>
          </div>

          {project?.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              <GitBranch size={12} />
              <span className="truncate">{project.branch || 'main'}</span>
            </a>
          )}
        </div>

        {/* Nav Items */}
        <nav className="p-2">
          {navItems.map((item, idx) => {
            const isActive = activeTab === item.tab;
            return (
              <motion.button
                key={item.tab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onTabChange(item.tab)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-200 group"
                style={{
                  background: isActive
                    ? 'rgba(99,102,241,0.12)'
                    : 'transparent',
                  color: isActive ? '#818cf8' : 'var(--text-muted)',
                  border: isActive
                    ? '1px solid rgba(99,102,241,0.2)'
                    : '1px solid transparent',
                }}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                {isActive && <ChevronRight size={14} style={{ color: '#818cf8' }} />}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-5 py-4 mt-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Project ID
          </p>
          <p
            className="text-xs font-mono mt-1 truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {project?._id || '—'}
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
