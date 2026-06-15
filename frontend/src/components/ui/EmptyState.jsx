import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  description = 'Get started by creating your first item.',
  actionLabel,
  onAction,
  actionIcon,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center py-20 px-6"
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="mb-6 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <span style={{ color: '#6366f1' }}>{icon}</span>
        </motion.div>
      )}
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm max-w-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="btn-primary"
        >
          {actionIcon || <Plus size={16} />}
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
