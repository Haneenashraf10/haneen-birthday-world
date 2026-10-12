import { useEffect } from 'react'
import './Sparkle.css'

const COLORS = ['#ff8fc2', '#ffc23c', '#ffffff', '#c81768', '#ffb3d6']
const MAX_SPARKLES = 40

// A little trail of sparkles that follows the mouse or your finger
export default function SparkleTrail() {
  useEffect(() => {
    const layer = document.createElement('div')
    layer.className = 'sparkle-layer'
    layer.setAttribute('aria-hidden', 'true')
    document.body.appendChild(layer)

    let lastTime = 0

    const spawn = (x: number, y: number, spread = 10) => {
      // the dashboard stays clean
      if (window.location.hash === '#/admin') return

      if (layer.childElementCount >= MAX_SPARKLES) return

      const sparkle = document.createElement('span')
      const size = 8 + Math.random() * 10

      sparkle.className = 'sparkle'
      sparkle.style.left = `${x + (Math.random() - 0.5) * spread}px`
      sparkle.style.top = `${y + (Math.random() - 0.5) * spread}px`
      sparkle.style.width = `${size}px`
      sparkle.style.height = `${size}px`
      sparkle.style.background =
        COLORS[Math.floor(Math.random() * COLORS.length)]
      sparkle.style.setProperty('--dx', `${(Math.random() - 0.5) * 36}px`)
      sparkle.style.setProperty('--dy', `${10 + Math.random() * 26}px`)

      sparkle.addEventListener('animationend', () => sparkle.remove())
      layer.appendChild(sparkle)
    }

    const trail = (x: number, y: number) => {
      const now = performance.now()

      if (now - lastTime < 40) return

      lastTime = now
      spawn(x, y)
    }

    // mouse and pen
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return

      trail(event.clientX, event.clientY)
    }

    // finger (touch events keep firing even while the page scrolls)
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]

      if (touch) {
        trail(touch.clientX, touch.clientY)
      }
    }

    const handleDown = (event: PointerEvent) => {
      for (let i = 0; i < 6; i++) {
        spawn(event.clientX, event.clientY, 44)
      }
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('touchmove', handleTouchMove)
      layer.remove()
    }
  }, [])

  return null
}
