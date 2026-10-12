import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import Confetti from './Confetti'
import './BirthdayCake.css'

type Props = {
  name: string
  onWishSent?: () => void
}

const CANDLE_COUNT = 5

export default function BirthdayCake({ name, onWishSent }: Props) {
  const [blown, setBlown] = useState<boolean[]>(
    Array(CANDLE_COUNT).fill(false),
  )
  const [wish, setWish] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')

  const wishRef = useRef<HTMLDivElement | null>(null)

  const remaining = blown.filter((isOut) => !isOut).length
  const allBlown = remaining === 0

  // When the last candle goes out, gently scroll to the wish box
  useEffect(() => {
    if (allBlown && wishRef.current) {
      wishRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [allBlown])

  const blowCandle = (index: number) => {
    setBlown((previous) =>
      previous.map((isOut, i) => (i === index ? true : isOut)),
    )
  }

  const sendWish = async () => {
    const text = wish.trim()

    if (!text) {
      alert('Write your wish first 💗')
      return
    }

    if (!supabase) {
      setStatus('error')
      return
    }

    setStatus('sending')

    const { error } = await supabase.from('birthday_wishes').insert({
      friend_name: name.trim(),
      wish_text: text,
    })

    if (error) {
      console.error('Error saving wish:', error)
      setStatus('error')
      return
    }

    setWish('')
    setStatus('sent')
    onWishSent?.()
  }

  const lightAgain = () => {
    setBlown(Array(CANDLE_COUNT).fill(false))
    setWish('')
    setStatus('idle')
  }

  return (
    <section className="cake-section">
      {status === 'sent' && <Confetti />}

      <div className="cake-card">
        <h2 className="cake-title">Make a wish 🎂</h2>

        {!allBlown && (
          <p className="cake-note">
            Tap each candle to blow it out 🕯️
            <br />
            <strong>{remaining}</strong>{' '}
            {remaining === 1 ? 'candle' : 'candles'} left
          </p>
        )}

        {allBlown && status !== 'sent' && (
          <p className="cake-note">
            All the candles are out! ✨
            <br />
            Now close your eyes and make a wish for Haneen 💗
          </p>
        )}

        <div className="cake">
          <div className="cake-candles">
            {blown.map((isOut, index) => (
              <button
                key={index}
                type="button"
                className={isOut ? 'candle out' : 'candle'}
                onClick={() => blowCandle(index)}
                disabled={isOut}
                aria-label={
                  isOut
                    ? `Candle ${index + 1} is out`
                    : `Blow out candle ${index + 1}`
                }
              >
                <span className="flame" />
                <span className="smoke" />
                <span className="stick" />
              </button>
            ))}
          </div>

          <div className="cake-top-tier" />
          <div className="cake-bottom-tier" />
          <div className="cake-plate" />
        </div>

        {allBlown && (
          <div className="wish-box" ref={wishRef}>
            {status !== 'sent' ? (
              <>
                <textarea
                  className="message-input"
                  dir="auto"
                  rows={4}
                  maxLength={1000}
                  value={wish}
                  onChange={(event) => setWish(event.target.value)}
                  placeholder="I wish for you..."
                />

                {status === 'error' && (
                  <p className="message-error">
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  className="quiz-button"
                  onClick={sendWish}
                  disabled={status === 'sending'}
                >
                  {status === 'sending'
                    ? 'Sending...'
                    : 'Send my wish 🌟'}
                </button>
              </>
            ) : (
              <>
                <h3 className="wish-sent-title">
                  Your wish is on its way 💗
                </h3>

                <p className="cake-note">
                  Haneen will love reading it.
                </p>

                <button className="quiz-button" onClick={lightAgain}>
                  Light the candles again 🔥
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}