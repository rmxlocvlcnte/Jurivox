export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-dvh" style={{ background: '#f8fafc' }}>
      <div className="flex flex-col items-center gap-4">
        {/* Spinner com gradiente dourado */}
        <div className="relative w-14 h-14">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, #f59e0b, #fbbf24, transparent)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
            }}
          />
          <div
            className="absolute inset-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', opacity: 0.15 }}
          />
        </div>
        <p className="text-sm text-slate-400 font-medium">Carregando...</p>
      </div>
    </div>
  )
}
