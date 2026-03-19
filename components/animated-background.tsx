'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  size: number
  alpha: number
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let t = 0

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Partículas 3D
    const N = 90
    const particles: Particle[] = Array.from({ length: N }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2,
      vx: (Math.random() - 0.5) * 0.0008,
      vy: (Math.random() - 0.5) * 0.0008,
      vz: (Math.random() - 0.5) * 0.0008,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
    }))

    function rotateY(x: number, z: number, angle: number) {
      return {
        rx: x * Math.cos(angle) - z * Math.sin(angle),
        rz: x * Math.sin(angle) + z * Math.cos(angle),
      }
    }

    function rotateX(y: number, z: number, angle: number) {
      return {
        ry: y * Math.cos(angle) - z * Math.sin(angle),
        rz: y * Math.sin(angle) + z * Math.cos(angle),
      }
    }

    function project(x: number, y: number, z: number) {
      const fov = 2.5
      const scale = fov / (fov + z + 1)
      if (!canvas) return { px: 0, py: 0, scale: 0 }
      return {
        px: (x * scale * 0.5 + 0.5) * canvas.width,
        py: (y * scale * 0.5 + 0.5) * canvas.height,
        scale,
      }
    }

    function draw() {
      if (!canvas || !ctx) return
      t += 0.004

      // Fundo com gradiente radial profundo
      const bg = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
      )
      bg.addColorStop(0, '#0d1b3e')
      bg.addColorStop(0.5, '#071227')
      bg.addColorStop(1, '#020917')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Orbs flutuantes grandes
      const orbPositions = [
        { cx: canvas.width * 0.15, cy: canvas.height * 0.2, r: 200, color: '59, 130, 246' },
        { cx: canvas.width * 0.85, cy: canvas.height * 0.75, r: 250, color: '245, 158, 11' },
        { cx: canvas.width * 0.5, cy: canvas.height * 0.9, r: 180, color: '99, 102, 241' },
      ]
      orbPositions.forEach(({ cx, cy, r, color }) => {
        const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        orb.addColorStop(0, `rgba(${color}, 0.12)`)
        orb.addColorStop(1, `rgba(${color}, 0)`)
        ctx.fillStyle = orb
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })

      // Projetar e animar partículas
      const projected = particles.map(p => {
        p.x += p.vx
        p.y += p.vy
        p.z += p.vz
        if (Math.abs(p.x) > 1) p.vx *= -1
        if (Math.abs(p.y) > 1) p.vy *= -1
        if (Math.abs(p.z) > 1) p.vz *= -1

        // Rotação dupla (X e Y)
        const ry = rotateY(p.x, p.z, t * 0.08)
        const rx = rotateX(p.y, ry.rz, t * 0.04)

        return {
          ...project(ry.rx, rx.ry, rx.rz),
          p,
        }
      })

      // Linhas de conexão
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = projected[i]
          const b = projected[j]
          const dist = Math.hypot(a.px - b.px, a.py - b.py)
          const maxDist = Math.min(canvas.width, canvas.height) * 0.18
          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.18 * Math.min(a.scale, b.scale)
            ctx.beginPath()
            ctx.moveTo(a.px, a.py)
            ctx.lineTo(b.px, b.py)
            ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Partículas com glow
      projected.forEach(({ px, py, scale, p }) => {
        if (scale <= 0) return
        const r = p.size * scale * 3

        // Glow externo
        const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 6)
        glow.addColorStop(0, `rgba(245, 158, 11, ${p.alpha * scale * 0.8})`)
        glow.addColorStop(0.5, `rgba(245, 158, 11, ${p.alpha * scale * 0.15})`)
        glow.addColorStop(1, 'rgba(245, 158, 11, 0)')
        ctx.beginPath()
        ctx.arc(px, py, r * 6, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Núcleo brilhante
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha * scale})`
        ctx.fill()
      })

      // Grade perspectiva sutil no fundo
      ctx.save()
      ctx.globalAlpha = 0.03
      const gridSize = 60
      const vanishX = canvas.width / 2
      const vanishY = canvas.height * 0.4
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 0.5
      for (let i = -20; i <= 20; i++) {
        ctx.beginPath()
        ctx.moveTo(vanishX, vanishY)
        ctx.lineTo(vanishX + i * gridSize * 4, canvas.height)
        ctx.stroke()
      }
      for (let j = 0; j < 12; j++) {
        const progress = j / 12
        const y = vanishY + (canvas.height - vanishY) * Math.pow(progress, 1.5)
        const spread = (y - vanishY) / (canvas.height - vanishY)
        ctx.beginPath()
        ctx.moveTo(vanishX - spread * canvas.width * 1.5, y)
        ctx.lineTo(vanishX + spread * canvas.width * 1.5, y)
        ctx.stroke()
      }
      ctx.restore()

      // Scan line suave
      const scanY = (Math.sin(t * 0.3) * 0.5 + 0.5) * canvas.height
      const scanGrad = ctx.createLinearGradient(0, scanY - 80, 0, scanY + 80)
      scanGrad.addColorStop(0, 'rgba(245, 158, 11, 0)')
      scanGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.025)')
      scanGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 80, canvas.width, 160)

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
