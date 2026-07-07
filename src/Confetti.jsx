import { useEffect, useRef } from 'react'
import './Confetti.css'

const COLORS = ['#c084fc', '#f5f0ff', '#ffd166', '#ff6b9d', '#7dd3fc']
const PARTICLE_COUNT = 160
const DURATION = 3000

function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    let prefersReducedMotion = false
    try {
      prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      prefersReducedMotion = false
    }
    if (prefersReducedMotion) return undefined

    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', handleResize)

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.5,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }))

    let animationFrame
    let startTime = null

    const draw = (timestamp) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      ctx.clearRect(0, 0, width, height)

      const fadeStart = DURATION - 600
      const opacity = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / 600) : 1

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.02
        p.rotation += p.rotationSpeed

        ctx.save()
        ctx.globalAlpha = opacity
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })

      if (elapsed < DURATION) {
        animationFrame = requestAnimationFrame(draw)
      }
    }

    animationFrame = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
}

export default Confetti
