'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [estado, setEstado] = useState<'oculto' | 'visivel' | 'saindo'>('oculto')

  useEffect(() => {
    // Mostra apenas uma vez por sessão
    if (sessionStorage.getItem('jurivox_splash')) return
    sessionStorage.setItem('jurivox_splash', '1')
    setEstado('visivel')
    const t1 = setTimeout(() => setEstado('saindo'), 3200)
    const t2 = setTimeout(() => setEstado('oculto'), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (estado === 'oculto') return null

  const letras = 'JURIVOX'.split('')

  return (
    <>
      <style>{`
        @keyframes jv-balancear {
          0%   { transform: rotate(-7deg); }
          100% { transform: rotate(7deg); }
        }
        @keyframes jv-aparecer {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes jv-brilhar {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes jv-pulso {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50%       { box-shadow: 0 0 0 28px rgba(245,158,11,0); }
        }
        @keyframes jv-anel {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes jv-letra {
          from { opacity: 0; transform: translateY(18px) scale(0.7); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes jv-linha {
          from { width: 0; opacity: 0; }
          to   { width: 72px; opacity: 1; }
        }
        @keyframes jv-tagline {
          from { opacity: 0; letter-spacing: 0.35em; }
          to   { opacity: 0.6; letter-spacing: 0.2em; }
        }
        @keyframes jv-particula {
          0%   { transform: translateY(0) scale(1); opacity: 0.5; }
          100% { transform: translateY(-80px) scale(0); opacity: 0; }
        }
        @keyframes jv-sair {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.04); }
        }
        @keyframes jv-glow-ring {
          0%, 100% { opacity: 0.25; }
          50%       { opacity: 0.55; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #020617 0%, #060d1f 50%, #020617 100%)',
          animation: estado === 'saindo' ? 'jv-sair 0.8s cubic-bezier(0.4,0,0.2,1) forwards' : undefined,
        }}
      >
        {/* Glow de fundo centralizado */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.04) 40%, transparent 70%)',
          animation: 'jv-glow-ring 2.4s ease-in-out 0.4s infinite',
          pointerEvents: 'none',
        }} />

        {/* Partículas flutuantes */}
        {[
          { left: '38%', delay: '0.5s', size: 3 },
          { left: '52%', delay: '0.9s', size: 2 },
          { left: '44%', delay: '1.3s', size: 2 },
          { left: '58%', delay: '0.7s', size: 3 },
          { left: '35%', delay: '1.1s', size: 2 },
          { left: '63%', delay: '0.3s', size: 2 },
        ].map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '42%',
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: '#f59e0b',
              animation: `jv-particula ${2 + i * 0.3}s ease-out ${p.delay} infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Anel externo decorativo */}
        <div
          style={{
            animation: 'jv-anel 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
            marginBottom: '28px',
          }}
        >
          <div style={{
            width: '148px',
            height: '148px',
            borderRadius: '50%',
            border: '1px solid rgba(245,158,11,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            animation: 'jv-brilhar 2.2s ease-in-out 1s infinite',
          }}>
            {/* Anel interno */}
            <div style={{
              position: 'absolute',
              inset: '10px',
              borderRadius: '50%',
              border: '1px solid rgba(245,158,11,0.25)',
            }} />

            {/* SVG Balança */}
            <div style={{
              animation: 'jv-aparecer 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.4s both',
            }}>
              <svg
                viewBox="0 0 100 110"
                width="80"
                height="88"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Pilar central */}
                <rect x="47.5" y="34" width="5" height="60" rx="2.5" fill="#f59e0b" />
                {/* Base */}
                <rect x="28" y="90" width="44" height="6" rx="3" fill="#fbbf24" />
                {/* Detalhe base central */}
                <rect x="44" y="86" width="12" height="6" rx="2" fill="#f59e0b" />

                {/* Grupo da viga — anima em torno do pivô (50, 36) */}
                <g style={{
                  transformOrigin: '50px 36px',
                  animation: 'jv-balancear 1.6s ease-in-out 0.8s infinite alternate',
                }}>
                  {/* Viga horizontal */}
                  <rect x="10" y="33" width="80" height="6" rx="3" fill="#fbbf24" />
                  {/* Pivô central */}
                  <circle cx="50" cy="36" r="5" fill="#fcd34d" />
                  <circle cx="50" cy="36" r="2.5" fill="#92400e" />

                  {/* Corrente esquerda */}
                  <line x1="16" y1="39" x2="16" y2="62" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="2 2" />
                  {/* Corrente direita */}
                  <line x1="84" y1="39" x2="84" y2="62" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="2 2" />

                  {/* Prato esquerdo */}
                  <path
                    d="M 5 62 Q 16 72 27 62"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    fill="rgba(245,158,11,0.2)"
                  />
                  <line x1="5" y1="62" x2="27" y2="62" stroke="#f59e0b" strokeWidth="1.5" />

                  {/* Prato direito */}
                  <path
                    d="M 73 62 Q 84 72 95 62"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    fill="rgba(245,158,11,0.2)"
                  />
                  <line x1="73" y1="62" x2="95" y2="62" stroke="#f59e0b" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Nome JURIVOX — letras animadas */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '1px',
        }}>
          {letras.map((letra, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize: '3.25rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: i < 4 ? '#ffffff' : '#f59e0b', // JURI branco, VOX âmbar
                textShadow: i >= 4 ? '0 0 40px rgba(245,158,11,0.6)' : '0 0 20px rgba(255,255,255,0.1)',
                fontFamily: 'inherit',
                animation: `jv-letra 0.45s cubic-bezier(0.34,1.56,0.64,1) ${0.9 + i * 0.08}s both`,
              }}
            >
              {letra}
            </span>
          ))}
        </div>

        {/* Linha decorativa */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.6), transparent)',
          marginTop: '12px',
          animation: 'jv-linha 0.6s ease 1.8s both',
        }} />

        {/* Tagline */}
        <p style={{
          marginTop: '14px',
          color: '#94a3b8',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          animation: 'jv-tagline 0.8s ease 2.1s both',
          textAlign: 'center',
        }}>
          Gestão Jurídica Inteligente
        </p>
      </div>
    </>
  )
}
