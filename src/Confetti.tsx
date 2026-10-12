import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './Confetti.css'

const COLORS = [
  '#c81768',
  '#ff8fc2',
  '#ffb3d6',
  '#ffc23c',
  '#ffffff',
  '#a78bfa',
  '#7dd3fc',
]
const PIECE_COUNT = 70
const DURATION_MS = 4500

type Piece = {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  color: string
  drift: number
  round: boolean
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.4 + Math.random() * 1.6,
    size: 7 + Math.random() * 7,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    drift: (Math.random() - 0.5) * 160,
    round: Math.random() > 0.6,
  }))
}

// Shows a short burst of confetti, then removes itself
export default function Confetti() {
  const [pieces] = useState(makePieces)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  // rendered straight into <body> so no parent can clip or move it
  return createPortal(
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.round ? piece.size : piece.size * 1.6,
              background: piece.color,
              borderRadius: piece.round ? '50%' : '2px',
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              '--drift': `${piece.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  )
}
