import { useState } from 'react'
import Confetti from './Confetti'
import './ThankYouLetter.css'

// The letter appears on 16 October 2026 (months start from 0, so 9 = October)
const OPEN_DATE = new Date(2026, 9, 16)

// ✏️ Write your own letter here (line breaks are kept, Arabic works too)
const LETTER_TEXT = `Thank you for being part of my birthday.

Every wish, message and memory you shared made this day so special, and I read every single one of them.

I'm really lucky to have you in my life.`

// Add  ?letter=1  to the link to preview the letter before the date
export function isLetterOpen() {
  if (window.location.search.includes('letter=1')) return true

  return Date.now() >= OPEN_DATE.getTime()
}

type Props = {
  name: string
}

export default function ThankYouLetter({ name }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <section className="letter-section">
      <div className="letter-teaser">
        <div className="letter-teaser-icon">💌</div>

        <h2>A letter from Haneen</h2>

        <p>Something I wrote just for you 💗</p>

        <button className="quiz-button" onClick={() => setOpen(true)}>
          Open my letter ✨
        </button>
      </div>

      {open && (
        <div className="letter-backdrop" onClick={() => setOpen(false)}>
          <Confetti />

          <article
            className="letter-paper"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="letter-dear">Dear {name.trim()},</p>

            <p className="letter-text" dir="auto">
              {LETTER_TEXT}
            </p>

            <p className="letter-sign">
              With all my love,
              <br />
              Haneen 💗
            </p>

            <button
              className="letter-close"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </article>
        </div>
      )}
    </section>
  )
}
