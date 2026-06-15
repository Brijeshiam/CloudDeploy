export default function LoadingSpinner({ size = 40, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, transparent)',
          animation: 'spin 0.8s linear infinite',
          padding: 3,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'var(--bg-primary)',
          }}
        />
      </div>
      {label && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '60vh' }}
    >
      <LoadingSpinner size={48} label="Loading..." />
    </div>
  );
}
