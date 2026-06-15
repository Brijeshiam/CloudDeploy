export default function StatusBadge({ status, size = 'sm' }) {
  const configs = {
    running: {
      className: 'badge badge-running',
      label: 'Running',
      pulse: true,
    },
    building: {
      className: 'badge badge-building',
      label: 'Building',
      pulse: true,
    },
    pushing: {
      className: 'badge badge-pushing',
      label: 'Pushing',
      pulse: true,
    },
    deploying: {
      className: 'badge badge-deploying',
      label: 'Deploying',
      pulse: true,
    },
    queued: {
      className: 'badge badge-queued',
      label: 'Queued',
      pulse: false,
    },
    failed: {
      className: 'badge badge-failed',
      label: 'Failed',
      pulse: false,
    },
    stopped: {
      className: 'badge badge-stopped',
      label: 'Stopped',
      pulse: false,
    },
    archived: {
      className: 'badge badge-archived',
      label: 'Archived',
      pulse: false,
    },
    pending: {
      className: 'badge badge-queued',
      label: 'Pending',
      pulse: true,
    },
    terminating: {
      className: 'badge badge-failed',
      label: 'Terminating',
      pulse: true,
    },
  };

  const config = configs[status?.toLowerCase()] || configs.stopped;

  return (
    <span className={config.className}>
      {config.pulse && <span className="pulse-dot" />}
      {config.label}
    </span>
  );
}
