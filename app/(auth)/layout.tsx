import { AnimatedBackground } from '@/components/animated-background'
import { Scale } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh flex items-center justify-center overflow-hidden"
         style={{ background: '#020917' }}>

      {/* Animação 3D de fundo */}
      <AnimatedBackground />

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-md px-4 py-12">

        {/* Logo animada */}
        <div className="text-center mb-8 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
          <div className="flex justify-center mb-4">
            <div
              className="relative animate-float animate-pulse-glow"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '20px',
                padding: '14px',
              }}
            >
              <Scale className="w-9 h-9 text-white" />
              <div
                className="absolute inset-0 rounded-[20px] opacity-40"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)' }}
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gradient-shimmer mb-1">
            JurisFlow
          </h1>
          <p className="text-slate-400 text-sm">Gestão jurídica simplificada</p>
        </div>

        {/* Card glassmorphism */}
        <div className="opacity-0 animate-scale-in delay-200" style={{ animationFillMode: 'forwards' }}>
          <div
            className="rounded-2xl p-px"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.4), rgba(99,102,241,0.2), rgba(245,158,11,0.1))' }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8, 15, 35, 0.9)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {children}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 opacity-0 animate-fade-in delay-500"
           style={{ animationFillMode: 'forwards' }}>
          © 2025 JurisFlow · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
