import { useState, useEffect, useCallback, useRef } from 'react';
import { kubernetesAPI } from '../services/api';
import { onPodStatus, joinProjectRoom, leaveProjectRoom } from '../services/socket';

export function usePodStatus(projectId) {
  const [pods, setPods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchPods = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await kubernetesAPI.getPods(projectId);
      setPods(response.data.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pods');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Initial fetch + polling every 10s
  useEffect(() => {
    if (!projectId) return;

    fetchPods();
    intervalRef.current = setInterval(fetchPods, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [projectId, fetchPods]);

  // Real-time pod updates via socket
  useEffect(() => {
    if (!projectId) return;

    joinProjectRoom(projectId);

    const unsubscribe = onPodStatus((data) => {
      if (data.projectId !== projectId) return;
      setPods((prev) => {
        const idx = prev.findIndex((p) => p.name === data.pod.name);
        if (idx === -1) return [...prev, data.pod];
        const updated = [...prev];
        updated[idx] = data.pod;
        return updated;
      });
      setLastUpdated(new Date());
    });

    return () => {
      leaveProjectRoom(projectId);
      unsubscribe();
    };
  }, [projectId]);

  return { pods, isLoading, error, lastUpdated, refetch: fetchPods };
}
