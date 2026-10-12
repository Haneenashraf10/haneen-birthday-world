import { useEffect, useState } from 'react'
import './Countdown.css'

// Haneen's birthday: 15 October
const BIRTH_MONTH_INDEX = 9
const BIRTH_DAY = 15

function getTimeLeft(now: Date) {
  const isToday =
    now.getMonth() === BIRTH_MONTH_INDEX && now.getDate() === BIRTH_DAY

  if (isToday) return null

  let target = new Date(now.getFullYear(), BIRTH_MONTH_INDEX, BIRTH_DAY)

  if (target.getTime() <= now.getTime()) {
    target = new Date(now.getFullYear() + 1, BIRTH_MONTH_INDEX, BIRTH_DAY)
  }

  const totalSeconds = Math.floor((target.getTime() - now.getTime()) / 1000)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

const pad = (value: number) => String(value).padStart(2, '0')

export default function Countdown() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeLeft = getTimeLeft(now)

  if (!timeLeft) {
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
    { label: 'Days', value: String(timeLeft.days) },
    { label: 'Hours', value: pad(timeLeft.hours) },
    { label: 'Min', value: pad(timeLeft.minutes) },
    { label: 'Sec', value: pad(timeLeft.seconds) },
  ]

  return (
    <section className="countdown">
      <p className="countdown-label">Haneen's birthday is in ⏳</p>

      <div className="countdown-boxes">
        {units.map((unit) => (
          <div className="countdown-box" key={unit.label}>
            <span className="countdown-value">{unit.value}</span>
            <span className="countdown-unit">{unit.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
