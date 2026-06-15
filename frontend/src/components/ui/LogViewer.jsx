import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Terminal, Wifi, WifiOff } from 'lucide-react';
import { useDeploymentLogs } from '../../hooks/useDeploymentLogs';

function colorizeLog(message) {
  // Basic ANSI-style coloring based on content patterns
  if (/\b(error|err|failed|failure|fatal|exception)\b/i.test(message)) {
    return 'log-error';
  }
  if (/\b(warn|warning|deprecated)\b/i.test(message)) {
    return 'log-warn';
  }
  if (/\b(success|done|complete|✓|✔|passed)\b/i.test(message)) {
    return 'log-info';
  }
  if (/\b(debug|verbose|trace)\b/i.test(message)) {
    return 'log-debug';
  }
  return '';
}

function formatTimestamp(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return '';
  }
}

function LogLine({ log, index }) {
  const textClass = colorizeLog(log.message);
  return (
    <div className="flex gap-2 hover:bg-white/[0.02] px-2 py-0.5 rounded group">
      <span className="log-timestamp text-xs shrink-0 pt-px select-none">
        {formatTimestamp(log.timestamp)}
      </span>
      <span className={`text-xs break-all leading-relaxed ${textClass}`}>
        {log.message}
      </span>
    </div>
  );
}

export default function LogViewer({
  deploymentId,
  projectId,
  title = 'Logs',
  maxHeight = 500,
}) {
  const { logs, isConnected, isLoading, clearLogs, downloadLogs } =
    useDeploymentLogs(deploymentId, projectId);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (autoScroll && !userScrolled && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, userScrolled]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setUserScrolled(!isNearBottom);
    setAutoScroll(isNearBottom);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserScrolled(false);
    setAutoScroll(true);
  };

  return (
    <div className="terminal">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="flex items-center gap-4">
          <div className="terminal-dots">
            <div className="terminal-dot terminal-dot-red" />
            <div className="terminal-dot terminal-dot-yellow" />
            <div className="terminal-dot terminal-dot-green" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal size={13} style={{ color: '#94a3b8' }} />
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
              {title}
            </span>
          </div>
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <Wifi size={11} style={{ color: '#10b981' }} />
                <span className="text-xs" style={{ color: '#10b981' }}>Live</span>
              </>
            ) : (
              <>
                <WifiOff size={11} style={{ color: '#475569' }} />
                <span className="text-xs" style={{ color: '#475569' }}>Offline</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#475569' }}>
            {logs.length} lines
          </span>
          <button
            onClick={downloadLogs}
            className="btn-icon btn-sm"
            title="Download logs"
          >
            <Download size={13} />
          </button>
          <button
            onClick={clearLogs}
            className="btn-icon btn-sm"
            title="Clear logs"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Log Body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="terminal-body relative"
        style={{ maxHeight, overflowY: 'auto' }}
      >
        {isLoading && logs.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3" style={{ color: '#475569' }}>
              <div
                className="w-4 h-4 border-2 border-current rounded-full animate-spin"
                style={{ borderTopColor: 'transparent' }}
              />
              <span className="text-xs">Loading logs...</span>
            </div>
          </div>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs" style={{ color: '#475569' }}>
              No logs yet. Waiting for output...
            </p>
          </div>
        )}

        {logs.map((log, idx) => (
          <LogLine key={log.id || idx} log={log} index={idx} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {userScrolled && logs.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#818cf8',
            cursor: 'pointer',
          }}
        >
          ↓ Jump to bottom
        </motion.button>
      )}
    </div>
  );
}
