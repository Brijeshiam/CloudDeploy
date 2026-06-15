import { motion } from 'framer-motion';
import {
  Clock,
  Package,
  Upload,
  Server,
  CheckCircle,
  XCircle,
  Loader2,
  Circle,
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';

const STEPS = [
  { key: 'queued', label: 'Queued', icon: Clock },
  { key: 'building', label: 'Building', icon: Package },
  { key: 'pushing', label: 'Pushing', icon: Upload },
  { key: 'deploying', label: 'Deploying', icon: Server },
  { key: 'running', label: 'Running', icon: CheckCircle },
];

const STATUS_ORDER = {
  queued: 0,
  building: 1,
  pushing: 2,
  deploying: 3,
  running: 4,
  failed: -1,
  stopped: -1,
};

export default function DeploymentTimeline({ deployment, compact = false }) {
  const currentStatusIdx = STATUS_ORDER[deployment?.status] ?? 0;
  const isFailed = deployment?.status === 'failed';
  const failedAt = isFailed ? currentStatusIdx : -1;

  return (
    <div className={`flex ${compact ? 'flex-row gap-0' : 'flex-col gap-0'} relative`}>
      {STEPS.map((step, idx) => {
        const stepStatus = getStepStatus(idx, currentStatusIdx, isFailed);
        const timestamps = deployment?.timestamps || {};
        const ts = timestamps[step.key];
        const nextTs = STEPS[idx + 1] ? timestamps[STEPS[idx + 1].key] : null;

        if (compact) {
          return (
            <CompactStep
              key={step.key}
              step={step}
              status={stepStatus}
              isLast={idx === STEPS.length - 1}
              timestamp={ts}
            />
          );
        }

        return (
          <FullStep
            key={step.key}
            step={step}
            status={stepStatus}
            isLast={idx === STEPS.length - 1}
            timestamp={ts}
            nextTimestamp={nextTs}
          />
        );
      })}

      {isFailed && !compact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 mt-2"
        >
          <div className="flex flex-col items-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444' }}
            >
              <XCircle size={16} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div className="flex-1 pt-1.5">
            <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>Failed</p>
            {deployment?.errorMessage && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {deployment.errorMessage}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function getStepStatus(idx, currentIdx, isFailed) {
  if (isFailed) {
    if (idx < currentIdx) return 'completed';
    if (idx === currentIdx) return 'failed';
    return 'pending';
  }
  if (idx < currentIdx) return 'completed';
  if (idx === currentIdx) return 'active';
  return 'pending';
}

function FullStep({ step, status, isLast, timestamp, nextTimestamp }) {
  const Icon = step.icon;
  const duration =
    timestamp && nextTimestamp
      ? differenceInSeconds(new Date(nextTimestamp), new Date(timestamp))
      : null;

  const iconConfig = {
    completed: {
      bg: 'rgba(16,185,129,0.15)',
      border: '#10b981',
      color: '#10b981',
      icon: <CheckCircle size={16} />,
    },
    active: {
      bg: 'rgba(99,102,241,0.15)',
      border: '#6366f1',
      color: '#818cf8',
      icon: <Loader2 size={16} className="animate-spin" />,
    },
    failed: {
      bg: 'rgba(239,68,68,0.15)',
      border: '#ef4444',
      color: '#ef4444',
      icon: <XCircle size={16} />,
    },
    pending: {
      bg: 'rgba(71,85,105,0.1)',
      border: 'rgba(71,85,105,0.3)',
      color: '#475569',
      icon: <Circle size={16} />,
    },
  };

  const cfg = iconConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4"
    >
      <div className="flex flex-col items-center">
        <motion.div
          animate={status === 'active' ? { boxShadow: ['0 0 0px rgba(99,102,241,0.4)', '0 0 16px rgba(99,102,241,0.6)', '0 0 0px rgba(99,102,241,0.4)'] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: cfg.bg,
            border: `2px solid ${cfg.border}`,
            color: cfg.color,
          }}
        >
          {cfg.icon}
        </motion.div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-1 mb-1"
            style={{
              background: status === 'completed'
                ? 'linear-gradient(to bottom, #10b981, rgba(16,185,129,0.3))'
                : 'rgba(255,255,255,0.06)',
              minHeight: 28,
            }}
          />
        )}
      </div>
      <div className="flex-1 pb-5">
        <div className="flex items-center justify-between">
          <p
            className="text-sm font-semibold"
            style={{
              color: status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
          >
            {step.label}
          </p>
          {duration !== null && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {duration}s
            </span>
          )}
        </div>
        {timestamp && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {format(new Date(timestamp), 'HH:mm:ss')} ·{' '}
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function CompactStep({ step, status, isLast, timestamp }) {
  const Icon = step.icon;

  const colors = {
    completed: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', color: '#10b981' },
    active: { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', color: '#818cf8' },
    failed: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', color: '#ef4444' },
    pending: { bg: 'rgba(71,85,105,0.1)', border: 'rgba(71,85,105,0.3)', color: '#475569' },
  };

  const cfg = colors[status];

  return (
    <div className="flex items-center">
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
        }}
        title={timestamp ? format(new Date(timestamp), 'HH:mm:ss') : step.label}
      >
        {status === 'active' ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Icon size={11} />
        )}
        <span>{step.label}</span>
      </div>
      {!isLast && (
        <div
          className="h-px w-4"
          style={{
            background: status === 'completed' ? '#10b981' : 'rgba(255,255,255,0.08)',
          }}
        />
      )}
    </div>
  );
}
