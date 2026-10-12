import { useState } from 'react'
import Confetti from './Confetti'
import './ThankYouLetter.css'

// ✏️ The letter (you can edit both versions; line breaks are kept)
const LETTER_EN = `Thank you for stepping into my little world and trying everything inside it. It truly means a lot to me.

Thank you for every kind word you wrote, every message, wish and comment. I read them all, and they made my birthday so much brighter.

And more than anything, thank you for being in my life. Having you around is one of the nicest gifts I could have asked for.`

const LETTER_AR = `شكراً إنك دخلت عالمي الصغير وجربت كل حاجة فيه، ده فرق معايا جداً.

شكراً على كل كلمة حلوة كتبتها، كل رسالة وأمنية وتعليق. قريتهم كلهم، وخلّوا عيد ميلادي أحلى بكتير.

وأكتر من أي حاجة، شكراً على وجودك في حياتي. وجودك من أحلى الهدايا اللي كنت أتمناها.`

type Task = {
  key: string
  label: string
  done: boolean
}

type Props = {
  name: string
  tasks: Task[]
}

export default function ThankYouLetter({ name, tasks }: Props) {
  const [open, setOpen] = useState(false)

  const doneCount = tasks.filter((task) => task.done).length

  // Add  ?letter=1  to the link to preview the letter without finishing everything
  const unlocked =
    doneCount === tasks.length ||
    window.location.search.includes('letter=1')

  if (!unlocked) {
    return (
      <section className="letter-section">
        <div className="letter-teaser letter-locked">
          <div className="letter-teaser-icon">🔒</div>

          <h2>A letter is waiting for you</h2>

          <p>Try everything in my world to unlock it 💗</p>

          <div className="letter-progress">
            <div
              className="letter-progress-fill"
              style={{ width: `${(doneCount / tasks.length) * 100}%` }}
            />
          </div>

          <small>
            {doneCount} / {tasks.length}
          </small>

          <ul className="letter-tasks">
            {tasks.map((task) => (
              <li key={task.key} className={task.done ? 'done' : ''}>
                {task.done ? '✅' : '⬜'} {task.label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  return (
    <section className="letter-section">
      <div className="letter-teaser letter-unlocked">
        <div className="letter-teaser-icon">💌</div>

        <h2>You did it! 🎉</h2>

        <p>A letter from Haneen is waiting for you 💗</p>

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
            <div className="letter-lang" dir="ltr">
              <p className="letter-dear">Dear {name.trim()},</p>

              <p className="letter-text">{LETTER_EN}</p>

              <p className="letter-sign">
                With all my love,
                <br />
                Haneen 💗
              </p>
            </div>

            <hr className="letter-divider" />

            <div className="letter-lang" dir="rtl">
              <p className="letter-dear">إلى {name.trim()} 💗</p>

              <p className="letter-text">{LETTER_AR}</p>

              <p className="letter-sign">
                بكل حبي،
                <br />
                حنين 💗
              </p>
            </div>

            <button
              className="letter-close"
              onClick={() => setOpen(false)}
            >
              Close · إغلاق
            </button>
          </article>
        </div>
      )}
    </section>
  )
}