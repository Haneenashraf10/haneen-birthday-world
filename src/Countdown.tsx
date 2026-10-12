import { useEffect, useState } from 'react'
import { getCountdownState } from './countdownLogic'
import './Countdown.css'

const pad = (value: number) => String(value).padStart(2, '0')

export default function Countdown() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const state = getCountdownState(now)

  if (state.kind === 'today') {
    return (
      <section className="countdown countdown-today">
        <p className="countdown-today-text">
          🎉 Today is the day! 🎉
          <br />
          <strong>Happy Birthday, Haneen 🎂💗</strong>
        </p>
      </section>
    )
  }

  const units = [
    { label: 'Days', value: String(state.days) },
    { label: 'Hours', value: pad(state.hours) },
    { label: 'Min', value: pad(state.minutes) },
    { label: 'Sec', value: pad(state.seconds) },
  ]

  return (
    <section className="countdown">
      <p className="countdown-label">
        {state.kind === 'before'
          ? "Haneen's birthday is in ⏳"
          : "Haneen's next birthday is in ⏳"}
      </p>

      <div className="countdown-boxes">
        {units.map((unit) => (
          <div className="countdown-box" key={unit.label}>
            <span className="countdown-value">{unit.value}</span>
            <span className="countdown-unit">{unit.label}</span>
          </div>
        ))}
      </div>

      {state.kind === 'after' && (
        <p className="countdown-note">
          🎂{' '}
          {state.daysSince === 1
            ? 'The birthday was yesterday'
            : `The birthday was ${state.daysSince} days ago`}
        </p>
      )}
    </section>
  )
}
