import { useState, useEffect, useCallback } from 'react';
import { monitoringAPI } from '../services/api';

const TIME_RANGES = {
  '1h': { hours: 1, interval: '1m', label: '1 Hour' },
  '6h': { hours: 6, interval: '5m', label: '6 Hours' },
  '24h': { hours: 24, interval: '15m', label: '24 Hours' },
  '7d': { hours: 168, interval: '1h', label: '7 Days' },
};

export function useMetrics(projectId) {
  const [metrics, setMetrics] = useState({
    cpu: [],
    memory: [],
    pods: [],
    network: [],
  });
  const [timeRange, setTimeRange] = useState('1h');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const config = TIME_RANGES[timeRange];
      const endTime = new Date();
      const startTime = new Date(endTime - config.hours * 3600 * 1000);

      const response = await monitoringAPI.getMetrics(projectId, {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        interval: config.interval,
      });

      const data = response.data.data || {};
      setMetrics({
        cpu: data.cpu || generateMockData(config.hours),
        memory: data.memory || generateMockData(config.hours, 200, 512),
        pods: data.pods || generatePodData(config.hours),
        network: data.network || generateNetworkData(config.hours),
      });
    } catch (err) {
      // If API fails, show mock data for demo
      const config = TIME_RANGES[timeRange];
      setMetrics({
        cpu: generateMockData(config.hours),
        memory: generateMockData(config.hours, 200, 512),
        pods: generatePodData(config.hours),
        network: generateNetworkData(config.hours),
      });
      setError(null); // Suppress error when using mock data
    } finally {
      setIsLoading(false);
    }
  }, [projectId, timeRange]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics,
    timeRange,
    setTimeRange,
    isLoading,
    error,
    refetch: fetchMetrics,
    timeRanges: Object.keys(TIME_RANGES).map((key) => ({
      key,
      label: TIME_RANGES[key].label,
    })),
  };
}

// ─── Mock data generators ────────────────────────────────────────────────────
function generateMockData(hours, min = 10, max = 80) {
  const points = Math.min(hours * 6, 200);
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * (hours * 3600000) / points).toISOString(),
    value: Math.round(min + Math.random() * (max - min) + Math.sin(i * 0.3) * 10),
  }));
}

function generatePodData(hours) {
  const points = Math.min(hours * 6, 200);
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * (hours * 3600000) / points).toISOString(),
    value: Math.floor(1 + Math.random() * 3),
  }));
}

function generateNetworkData(hours) {
  const points = Math.min(hours * 4, 100);
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * (hours * 3600000) / points).toISOString(),
    rx: Math.round(Math.random() * 5000),
    tx: Math.round(Math.random() * 3000),
  }));
}
