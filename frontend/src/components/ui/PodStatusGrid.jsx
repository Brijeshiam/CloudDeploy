import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePodStatus } from '../../hooks/usePodStatus';

function PodStatusIcon({ status }) {
  switch (status?.toLowerCase()) {
    case 'running':
      return <CheckCircle size={14} style={{ color: '#10b981' }} />;
    case 'pending':
      return <Clock size={14} style={{ color: '#f59e0b' }} />;
    case 'terminating':
      return <XCircle size={14} style={{ color: '#ef4444' }} />;
    case 'failed':
    case 'crashloopbackoff':
      return <AlertCircle size={14} style={{ color: '#ef4444' }} />;
    default:
      return <Clock size={14} style={{ color: '#6366f1' }} />;
  }
}

function StatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'running': return { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#10b981' };
    case 'pending': return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' };
    case 'failed':
    case 'crashloopbackoff': return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' };
    case 'terminating': return { bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.15)', text: '#f87171' };
    default: return { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', text: '#818cf8' };
  }
}

function UsageBar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : color || '#6366f1';
  return (
    <div className="progress-bar" style={{ width: '100%' }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
    </div>
  );
}

function PodCard({ pod, index }) {
  const colors = StatusColor(pod.status);
  const cpuPct = parseFloat(pod.cpuUsage) || 0;
  const memMB = parseFloat(pod.memoryUsage) || 0;
  const memLimitMB = parseFloat(pod.memoryLimit) || 512;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Pod Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PodStatusIcon status={pod.status} />
            <p
              className="text-xs font-semibold font-mono truncate"
              style={{ color: 'var(--text-primary)' }}
              title={pod.name}
            >
              {pod.name?.split('-').slice(-2).join('-') || pod.name}
            </p>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {pod.namespace || 'default'} · Age: {pod.age || '—'}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ color: colors.text, background: `${colors.bg}`, border: `1px solid ${colors.border}` }}
        >
          {pod.status}
        </span>
      </div>

      {/* CPU */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>CPU</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {cpuPct.toFixed(1)}%
          </span>
        </div>
        <UsageBar value={cpuPct} max={100} color="#6366f1" />
      </div>

      {/* Memory */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Memory</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {memMB.toFixed(0)}MB / {memLimitMB}MB
          </span>
        </div>
        <UsageBar value={memMB} max={memLimitMB} color="#8b5cf6" />
      </div>

      {/* Restarts */}
      {pod.restartCount !== undefined && (
        <div className="flex items-center gap-1.5">
          <RotateCcw size={11} style={{ color: pod.restartCount > 0 ? '#f59e0b' : 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: pod.restartCount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
            {pod.restartCount} restart{pod.restartCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function PodStatusGrid({ projectId }) {
  const { pods, isLoading, error, lastUpdated, refetch } = usePodStatus(projectId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Pods
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: 'rgba(99,102,241,0.12)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            {pods.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          )}
          <button
            onClick={refetch}
            className="btn-icon btn-sm"
            disabled={isLoading}
            title="Refresh pods"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg p-3 mb-4 text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
        >
          {error}
        </div>
      )}

      {isLoading && pods.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-4 h-36 skeleton" />
          ))}
        </div>
      )}

      {!isLoading && pods.length === 0 && !error && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No pods running. Deploy your project to start.
          </p>
        </div>
      )}

      {pods.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pods.map((pod, idx) => (
            <PodCard key={pod.name || idx} pod={pod} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
