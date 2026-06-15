import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatsCard({
  icon,
  value,
  label,
  trend,
  trendLabel,
  color = '#6366f1',
  index = 0,
}) {
  const trendIsPositive = trend > 0;
  const trendIsNeutral = trend === 0 || trend === undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        transition: 'all 0.3s ease',
      }}
      whileHover={{
        borderColor: `${color}30`,
        boxShadow: `0 8px 30px rgba(0,0,0,0.3)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}25`,
          }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
            style={{
              background: trendIsNeutral
                ? 'rgba(71,85,105,0.15)'
                : trendIsPositive
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(239,68,68,0.1)',
              color: trendIsNeutral
                ? 'var(--text-muted)'
                : trendIsPositive
                ? '#10b981'
                : '#ef4444',
            }}
          >
            {trendIsNeutral ? (
              <Minus size={11} />
            ) : trendIsPositive ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {!trendIsNeutral && `${Math.abs(trend)}%`}
            {trendIsNeutral && '—'}
          </div>
        )}
      </div>

      <div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.07 + 0.2 }}
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </motion.p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        {trendLabel && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {trendLabel}
          </p>
        )}
      </div>
    </motion.div>
  );
}
