import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { Cpu, MemoryStick, Activity, Network, RefreshCw } from 'lucide-react';
import { useMetrics } from '../../hooks/useMetrics';

const TIME_RANGE_LABELS = {
  '1h': '1H',
  '6h': '6H',
  '24h': '24H',
  '7d': '7D',
};

function CustomTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <p className="mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}{unit}</strong>
        </p>
      ))}
    </div>
  );
}

function ChartCard({ title, icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h4>
      </div>
      {children}
    </motion.div>
  );
}

function formatXAxis(tick, timeRange) {
  try {
    const d = new Date(tick);
    if (timeRange === '7d') return format(d, 'EEE');
    if (timeRange === '24h') return format(d, 'HH:mm');
    return format(d, 'HH:mm');
  } catch {
    return tick;
  }
}

export default function MetricsChart({ projectId }) {
  const { metrics, timeRange, setTimeRange, isLoading, refetch, timeRanges } =
    useMetrics(projectId);

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Metrics
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
            {Object.entries(TIME_RANGE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-200"
                style={{
                  background: timeRange === key ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: timeRange === key ? '#818cf8' : 'var(--text-muted)',
                  border: timeRange === key ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={refetch} className="btn-icon btn-sm" disabled={isLoading}>
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* CPU */}
        <ChartCard title="CPU Usage" icon={<Cpu size={15} />}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={metrics.cpu}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => formatXAxis(t, timeRange)}
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                unit="%"
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip unit="%" />} />
              <Area
                type="monotone"
                dataKey="value"
                name="CPU"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#cpuGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Memory */}
        <ChartCard title="Memory Usage" icon={<MemoryStick size={15} />}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={metrics.memory}>
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => formatXAxis(t, timeRange)}
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                unit="MB"
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip unit=" MB" />} />
              <Area
                type="monotone"
                dataKey="value"
                name="Memory"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#memGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#8b5cf6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pod Count */}
        <ChartCard title="Pod Count" icon={<Activity size={15} />}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={metrics.pods}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => formatXAxis(t, timeRange)}
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={24}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="stepAfter"
                dataKey="value"
                name="Pods"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Network I/O */}
        <ChartCard title="Network I/O" icon={<Network size={15} />}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={metrics.network}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => formatXAxis(t, timeRange)}
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                unit="B"
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip unit=" B" />} />
              <Legend
                wrapperStyle={{ fontSize: 10, color: '#475569' }}
              />
              <Bar dataKey="rx" name="RX" fill="rgba(99,102,241,0.6)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="tx" name="TX" fill="rgba(139,92,246,0.6)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
