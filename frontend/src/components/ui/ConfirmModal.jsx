import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  isLoading = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                background: '#13131f',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
                      border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                    }}
                  >
                    <AlertTriangle
                      size={18}
                      style={{ color: danger ? '#ef4444' : '#6366f1' }}
                    />
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onCancel}
                  className="btn-icon btn-sm"
                  style={{ marginTop: -4 }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-end gap-3 px-6 py-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <button
                  onClick={onCancel}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={danger ? 'btn-danger' : 'btn-primary'}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 border-2 border-current rounded-full animate-spin"
                        style={{ borderTopColor: 'transparent' }}
                      />
                      Processing...
                    </span>
                  ) : confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
