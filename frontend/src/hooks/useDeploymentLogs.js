import { useState, useEffect, useRef, useCallback } from 'react';
import { logsAPI } from '../services/api';
import {
  joinDeploymentRoom,
  leaveDeploymentRoom,
  onDeploymentLog,
} from '../services/socket';

const MAX_LOGS = 2000;

export function useDeploymentLogs(deploymentId, projectId) {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const logBufferRef = useRef([]);
  const flushTimerRef = useRef(null);

  // Flush buffered logs to state in batches for performance
  const flushBuffer = useCallback(() => {
    if (logBufferRef.current.length === 0) return;
    const newLogs = [...logBufferRef.current];
    logBufferRef.current = [];
    setLogs((prev) => {
      const combined = [...prev, ...newLogs];
      return combined.slice(-MAX_LOGS);
    });
  }, []);

  const handleLogEvent = useCallback(
    (data) => {
      const logEntry = {
        id: Date.now() + Math.random(),
        timestamp: data.timestamp || new Date().toISOString(),
        level: data.level || 'info',
        message: data.message || data.log || '',
        stream: data.stream || 'stdout',
      };
      logBufferRef.current.push(logEntry);
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushBuffer();
          flushTimerRef.current = null;
        }, 100);
      }
    },
    [flushBuffer]
  );

  // Fetch existing logs on mount
  useEffect(() => {
    if (!deploymentId || !projectId) return;

    setIsLoading(true);
    logsAPI
      .getBuildLogs(projectId, deploymentId)
      .then((res) => {
        // Backend paginated() returns { data: [...], meta: {...} }
        const existing = (res.data.data || res.data.logs || []).map((entry, i) => ({
          id: entry._id || i,
          timestamp: entry.timestamp || new Date().toISOString(),
          level: entry.level || 'info',
          message: entry.message || entry.log || '',
        }));
        setLogs(existing.slice(-MAX_LOGS));
      })
      .catch(() => {
        // No existing logs yet — that's fine
      })
      .finally(() => setIsLoading(false));
  }, [deploymentId, projectId]);

  // Subscribe to real-time logs
  useEffect(() => {
    if (!deploymentId) return;

    joinDeploymentRoom(deploymentId);
    setIsConnected(true);
    const unsubscribe = onDeploymentLog(handleLogEvent);

    return () => {
      leaveDeploymentRoom(deploymentId);
      setIsConnected(false);
      unsubscribe();
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushBuffer();
      }
    };
  }, [deploymentId, handleLogEvent, flushBuffer]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logBufferRef.current = [];
  }, []);

  const downloadLogs = useCallback(() => {
    // Build a plain-text blob from the currently loaded logs
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `deployment-${deploymentId}-logs.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, [logs, deploymentId]);

  return { logs, isConnected, isLoading, clearLogs, downloadLogs };
}
