import { useState, type FormEvent } from 'react'
import './App.css'
import { supabase } from './supabase'
import MemoryWall from './MemoryWall'

type Language = 'en' | 'ar'

type LeaderboardEntry = {
  friend_name: string
  best_score: number
  total_questions: number
}

type Question = {
  en: {
    question: string
    options: string[]
  }
  ar: {
    question: string
    options: string[]
  }
  correctAnswer: number
}

const questions: Question[] = [
  {
    en: {
      question: 'What is Haneen’s favorite Disney princess? 👑',
      options: ['Rapunzel', 'Mulan', 'Belle', 'Cinderella'],
    },
    ar: {
      question: 'من هي أميرة ديزني المفضلة عند حنين؟ 👑',
      options: ['رابونزل', 'مولان', 'بيل', 'سندريلا'],
    },
    correctAnswer: 1,
  },
  {
    en: {
      question: 'What is Haneen’s favorite cartoon? 📺',
      options: [
        'SpongeBob',
        'Doraemon',
        'Tom & Jerry',
        'Detective Conan',
      ],
    },
    ar: {
      question: 'ما هو الكرتون المفضل عند حنين؟ 📺',
      options: [
        'سبونج بوب',
        'دورايمون',
        'توم وجيري',
        'المحقق كونان',
      ],
    },
    correctAnswer: 3,
  },
  {
    en: {
      question: 'What is Haneen’s favorite animal? 🐴',
      options: ['Cats', 'Rabbits', 'Horses', 'Dogs'],
    },
    ar: {
      question: 'ما هو الحيوان المفضل عند حنين؟ 🐴',
      options: ['القطط', 'الأرانب', 'الخيول', 'الكلاب'],
    },
    correctAnswer: 2,
  },
  {
    en: {
      question: 'What type of novels does Haneen love most? 📚',
      options: [
        'Romance',
        'Comedy',
        'Mystery / Detective',
        'Fantasy',
      ],
    },
    ar: {
      question: 'ما هو نوع الروايات المفضل عند حنين؟ 📚',
      options: [
        'الرومانسية',
        'الكوميديا',
        'البوليسية / الغموض',
        'الفانتازيا',
      ],
    },
    correctAnswer: 2,
  },
  {
    en: {
      question: 'What are Haneen’s favorite hobbies? 🎨',
      options: [
        'Photography & traveling',
        'Drawing, cooking & reading',
        'Gaming & swimming',
        'Shopping & dancing',
      ],
    },
    ar: {
      question: 'ما هي هوايات حنين المفضلة؟ 🎨',
      options: [
        'التصوير والسفر',
        'الرسم والطبخ والقراءة',
        'الألعاب والسباحة',
        'التسوق والرقص',
      ],
    },
    correctAnswer: 1,
  },
  {
    en: {
      question: 'What is Haneen’s favorite color? 💗',
      options: ['Purple', 'Green', 'Pink', 'Blue'],
    },
    ar: {
      question: 'ما هو لون حنين المفضل؟ 💗',
      options: ['البنفسجي', 'الأخضر', 'البينك', 'الأزرق'],
    },
    correctAnswer: 2,
  },
  {
    en: {
      question: 'Where is Haneen’s dream destination? ✈️',
      options: ['Italy', 'Korea', 'France', 'Japan'],
    },
    ar: {
      question: 'ما هي وجهة أحلام حنين؟ ✈️',
      options: ['إيطاليا', 'كوريا', 'فرنسا', 'اليابان'],
    },
    correctAnswer: 1,
  },
  {
    en: {
      question: 'What is Haneen’s favorite food? 🍝',
      options: ['Sushi', 'Burger', 'Pasta', 'Pizza'],
    },
    ar: {
      question: 'ما هي الأكلة المفضلة عند حنين؟ 🍝',
      options: ['سوشي', 'برجر', 'مكرونة', 'بيتزا'],
    },
    correctAnswer: 2,
  },
  {
    en: {
      question: 'What is Haneen’s favorite season? ❄️',
      options: ['Autumn', 'Summer', 'Winter', 'Spring'],
    },
    ar: {
      question: 'ما هو الفصل المفضل عند حنين؟ ❄️',
      options: ['الخريف', 'الصيف', 'الشتاء', 'الربيع'],
    },
    correctAnswer: 2,
  },
  {
    en: {
      question: 'Which mood feels most like Haneen? 🍂',
      options: [
        'An energetic summer mood',
        'A crazy adventure mood',
        'A loud party mood',
        'A quiet autumn mood',
      ],
    },
    ar: {
      question: 'أي مود يشبه حنين أكثر؟ 🍂',
      options: [
        'مود صيفي مليء بالطاقة',
        'مود مغامرات مجنونة',
        'مود حفلة صاخبة',
        'مود هادئ خريفي',
      ],
    },
    correctAnswer: 3,
  },
]

function App() {
  const [envelopeOpened, setEnvelopeOpened] = useState(false)
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [nameEntered, setNameEntered] = useState(false)

  const [currentSection, setCurrentSection] = useState('home')

  const [language, setLanguage] = useState<Language>('en')

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [quizFinished, setQuizFinished] = useState(false)

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardStatus, setLeaderboardStatus] = useState<
    'idle' | 'loading' | 'error'
  >('idle')

  const [messageText, setMessageText] = useState('')
  const [messageStatus, setMessageStatus] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setScore(0)
    setAnswers([])
    setQuizFinished(false)
  }

  const handleSecretKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (key.trim() === '15102006') {
      setUnlocked(true)
      return
    }

    alert(
      language === 'en'
        ? 'Hmm... that is not the secret key 💗'
        : 'هممم... ده مش المفتاح السري 💗',
    )
  }

  const handleNameSubmit = () => {
    if (!name.trim()) {
      alert(
        language === 'en'
          ? 'Tell me your name first 💗'
          : 'اكتبي اسمك الأول 💗',
      )
      return
    }

    setNameEntered(true)
    setCurrentSection('home')
  }

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) {
      alert(
        language === 'en'
          ? 'Choose an answer first 💗'
          : 'اختاري إجابة أولًا 💗',
      )
      return
    }

    const isCorrect =
      selectedAnswer === questions[currentQuestion].correctAnswer

    const newScore = isCorrect ? score + 1 : score
    const newAnswers = [...answers, selectedAnswer]

    setScore(newScore)
    setAnswers(newAnswers)

    if (currentQuestion === questions.length - 1) {
      setQuizFinished(true)

      if (supabase) {
        try {
          const { error } = await supabase
            .from('quiz_results')
            .insert({
              friend_name: name.trim(),
              score: newScore,
              total_questions: questions.length,
              answers: newAnswers,
            })

          if (error) {
            console.error('Error saving quiz result:', error)
          } else {
            console.log('Quiz result saved successfully! 🎉')
          }
        } catch (error) {
          console.error('Unexpected Supabase error:', error)
        }
      } else {
        console.warn(
          'Supabase is not connected. Quiz result was not saved.',
        )
      }

      return
    }

    setCurrentQuestion(currentQuestion + 1)
    setSelectedAnswer(null)
  }

  const openLeaderboard = async () => {
    setCurrentSection('leaderboard')
    setLeaderboardStatus('loading')

    if (!supabase) {
      console.error(
        'Supabase is not connected. Check .env.local and restart npm.cmd run dev.',
      )
      setLeaderboardStatus('error')
      return
    }

    const { data, error } = await supabase.rpc('get_leaderboard')

    if (error) {
      console.error('Error loading leaderboard:', error)
      setLeaderboardStatus('error')
      return
    }

    setLeaderboard((data ?? []) as LeaderboardEntry[])
    setLeaderboardStatus('idle')
  }

  const handleSendMessage = async () => {
    const text = messageText.trim()

    if (!text) {
      alert('Write something first 💗')
      return
    }

    if (!supabase) {
      console.error(
        'Supabase is not connected. Check .env.local and restart npm.cmd run dev.',
      )
      setMessageStatus('error')
      return
    }

    setMessageStatus('sending')

    const { error } = await supabase.from('messages').insert({
      friend_name: name.trim(),
      message: text,
    })

    if (error) {
      console.error('Error saving message:', error)
      setMessageStatus('error')
      return
    }

    setMessageText('')
    setMessageStatus('sent')
  }

  const startQuiz = () => {
    resetQuiz()
    setCurrentSection('quiz')
  }

  // ENVELOPE

  if (!envelopeOpened) {
    return (
      <main className="envelope-page">
        <div className="envelope-content">
          <p className="envelope-small">
            A little invitation for you
          </p>

          <div className="envelope">
            <div className="envelope-flap"></div>

            <div className="envelope-body">
              <span>For my favorite people</span>
            </div>
          </div>

          <h1>You have a letter from Haneen 💗</h1>

          <p>
            There is a little world waiting for you inside...
          </p>

          <button
            className="open-envelope-button"
            onClick={() => setEnvelopeOpened(true)}
          >
            Open the envelope ✨
          </button>
        </div>
      </main>
    )
  }

  // SECRET KEY

  if (!unlocked) {
    return (
      <main className="key-page">
        <div className="letter-card">
          <div className="letter-icon">💌</div>

          <p className="letter-small">
            A little secret is needed...
          </p>

          <h1>
            Welcome to Haneen's Birthday World 🎂
          </h1>

          <p className="letter-text">
            Before you come in, I have one little question for you...
          </p>

          <form onSubmit={handleSecretKey}>
            <label htmlFor="birthday-key">
              What's the secret key? 🔐
            </label>

            <input
              id="birthday-key"
              type="text"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="Enter the secret key..."
              autoComplete="off"
            />

            <p className="hint">
              💡 It's the day the world got a little brighter ✨
            </p>

            <button type="submit" className="unlock-button">
              Unlock my world 🎀
            </button>
          </form>
        </div>
      </main>
    )
  }

  // NAME

  if (!nameEntered) {
    return (
      <main className="name-page">
        <div className="name-card">
          <div className="name-icon">✨</div>

          <p>One last thing... 💌</p>

          <h1>What should I call you?</h1>

          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleNameSubmit()
            }}
            placeholder="Your name..."
            autoComplete="off"
          />

          <button
            className="enter-world-button"
            onClick={handleNameSubmit}
          >
            Enter Haneen's World ✨
          </button>

          <button
            className="restart-button"
            onClick={() => {
              setEnvelopeOpened(false)
              setKey('')
              setName('')
              setUnlocked(false)
              setNameEntered(false)
            }}
          >
            Start again 💌
          </button>
        </div>
      </main>
    )
  }

  if (currentSection === 'quiz') {
    const question = questions[currentQuestion]
    const content = question[language]

    if (quizFinished) {
      return (
        <div className="app">
          <div className="world-page">
            <div className="quiz-language">
              <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
              >
                🇬🇧 EN
              </button>

              <span>|</span>

              <button
                className={language === 'ar' ? 'active' : ''}
                onClick={() => setLanguage('ar')}
              >
                🇪🇬 AR
              </button>
            </div>

            <div className="quiz-card result-card">
              <div className="result-icon">🎉</div>

              <p className="small-label">
                {language === 'en'
                  ? 'Quiz complete!'
                  : 'خلصتي الكويز!'}
              </p>

              <h1>
                {language === 'en'
                  ? `You got ${score} out of ${questions.length}!`
                  : `جبتي ${score} من ${questions.length}!`}
              </h1>

              <p className="result-message">
                {score === questions.length
                  ? language === 'en'
                    ? 'Okay... you REALLY know Haneen! 💗'
                    : 'أوكي... إنتِ فعلًا عارفة حنين جدًا! 💗'
                  : score >= 7
                    ? language === 'en'
                      ? 'Wow! You know Haneen pretty well! ✨'
                      : 'واو! إنتِ عارفة حنين كويس جدًا! ✨'
                    : score >= 4
                      ? language === 'en'
                        ? 'Not bad! There is still more to discover 💕'
                        : 'مش وحش! لسه في حاجات أكتر تكتشفيها 💕'
                      : language === 'en'
                        ? 'Looks like you need to know Haneen a little better 😭💗'
                        : 'شكلك محتاجة تعرفي حنين أكتر شوية 😭💗'}
              </p>

              <div className="result-score">
                <span>{score}</span>
                <small>/{questions.length}</small>
              </div>

              <div className="result-buttons">
                <button
                  className="main-button"
                  onClick={resetQuiz}
                >
                  {language === 'en'
                    ? 'Try again 🔄'
                    : 'جربي تاني 🔄'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() => {
                    resetQuiz()
                    setCurrentSection('home')
                  }}
                >
                  {language === 'en'
                    ? 'Back to Birthday World 🏠'
                    : 'العودة لعالم حنين 🏠'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const progress =
      ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="app">
        <div className="world-page">
          <div className="quiz-language">
            <button
              className={language === 'en' ? 'active' : ''}
              onClick={() => setLanguage('en')}
            >
              🇬🇧 EN
            </button>

            <span>|</span>

            <button
              className={language === 'ar' ? 'active' : ''}
              onClick={() => setLanguage('ar')}
            >
              🇪🇬 AR
            </button>
          </div>

          <div
            className="quiz-card"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="quiz-top">
              <button
                className="back-button"
                onClick={() => {
                  resetQuiz()
                  setCurrentSection('home')
                }}
              >
                ←
              </button>

              <span>
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>

            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="quiz-question-number">
              Question {currentQuestion + 1}
            </div>

            <h1>{content.question}</h1>

            <div className="quiz-options">
              {content.options.map((option, index) => (
                <button
                  key={option}
                  className={`quiz-option ${
                    selectedAnswer === index ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedAnswer(index)}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>

                  <span>{option}</span>
                </button>
              ))}
            </div>

            <button
              className="main-button quiz-next-button"
              onClick={handleNextQuestion}
            >
              {currentQuestion === questions.length - 1
                ? language === 'en'
                  ? 'See my result 🎉'
                  : 'شوفي النتيجة 🎉'
                : language === 'en'
                  ? 'Next question →'
                  : 'السؤال التالي →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentSection === 'messages') {
    return (
      <div className="app">
        <main className="quiz-page">
          <div className="quiz-card">
            <div className="quiz-icon">💌</div>

            {messageStatus === 'sent' ? (
              <>
                <h1>Message sent 💗</h1>

                <p className="message-note">
                  Haneen will love reading it.
                </p>

                <button
                  className="quiz-button"
                  onClick={() => setMessageStatus('idle')}
                >
                  Write another message ✍️
                </button>
              </>
            ) : (
              <>
                <h1>Leave Haneen a message</h1>

                <p className="message-note">
                  Write anything you like. Only Haneen can read it. 💕
                </p>

                <textarea
                  className="message-input"
                  dir="auto"
                  rows={6}
                  maxLength={1000}
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(event.target.value)
                  }
                  placeholder="Dear Haneen..."
                />

                {messageStatus === 'error' && (
                  <p className="message-error">
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  className="quiz-button"
                  onClick={handleSendMessage}
                  disabled={messageStatus === 'sending'}
                >
                  {messageStatus === 'sending'
                    ? 'Sending...'
                    : 'Send message 💌'}
                </button>
              </>
            )}

            <button
              className="back-button"
              onClick={() => setCurrentSection('home')}
            >
              ← Back to my world
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (currentSection === 'leaderboard') {
    return (
      <div className="app">
        <main className="quiz-page">
          <div className="quiz-card">
            <div className="quiz-icon">🏆</div>

            <h1>Friends Leaderboard</h1>

            {leaderboardStatus === 'loading' && (
              <p className="message-note">Loading the ranking... ✨</p>
            )}

            {leaderboardStatus === 'error' && (
              <p className="message-error">
                Could not load the leaderboard. Please try again.
              </p>
            )}

            {leaderboardStatus === 'idle' &&
              leaderboard.length === 0 && (
                <p className="message-note">
                  No scores yet. Be the first to take the quiz! 🎀
                </p>
              )}

            {leaderboardStatus === 'idle' &&
              leaderboard.length > 0 && (
                <ol className="leaderboard-list">
                  {leaderboard.map((entry, index) => {
                    let rank = index + 1

                    if (
                      index > 0 &&
                      leaderboard[index - 1].best_score ===
                        entry.best_score
                    ) {
                      rank = leaderboard.findIndex(
                        (item) =>
                          item.best_score === entry.best_score,
                      ) + 1
                    }

                    const medal =
                      rank === 1
                        ? '🥇'
                        : rank === 2
                          ? '🥈'
                          : rank === 3
                            ? '🥉'
                            : `${rank}`

                    const isMe =
                      entry.friend_name.toLowerCase() ===
                      name.trim().toLowerCase()

                    return (
                      <li
                        key={`${entry.friend_name}-${index}`}
                        className={
                          isMe
                            ? 'leaderboard-row me'
                            : 'leaderboard-row'
                        }
                      >
                        <span className="leaderboard-rank">
                          {medal}
                        </span>

                        <span className="leaderboard-name">
                          {entry.friend_name}
                        </span>

                        <span className="leaderboard-score">
                          {entry.best_score}/{entry.total_questions}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}

            <button
              className="back-button"
              onClick={() => setCurrentSection('home')}
            >
              ← Back to my world
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (currentSection === 'memories') {
    return (
      <MemoryWall
        name={name}
        onBack={() => setCurrentSection('home')}
      />
    )
  }

  return (
    <div className="app">
      <main className="world-page">
        <div className="world-sparkles">✨ ✦ ✧ 💗 ✧ ✦ ✨</div>

        <section className="world-hero">
          <p className="world-welcome">Welcome, {name.trim()} 💕</p>

          <h1>
            Welcome to Haneen's
            <br />
            Birthday World 🎂
          </h1>

          <p className="world-subtitle">
            I'm so happy you're here.
            <br />
            Let's make this birthday a little more special ✨
          </p>
        </section>

        <section className="world-menu">
          <p className="world-label">
            A little world made for my favorite people
          </p>

          <h2>What would you like to explore? 🎀</h2>

          <div className="world-cards">
            <button className="world-card" onClick={startQuiz}>
              <span className="world-card-icon">🎀</span>

              <h3>Birthday Quiz</h3>

              <p>How well do you know Haneen?</p>

              <span className="card-arrow">Enter quiz →</span>
            </button>

            <button
              className="world-card"
              onClick={openLeaderboard}
            >
              <span className="world-card-icon">🏆</span>

              <h3>Friends Leaderboard</h3>

              <p>See who knows Haneen best.</p>

              <span className="card-arrow">View ranking →</span>
            </button>

            <button
              className="world-card"
              onClick={() => {
                setMessageStatus('idle')
                setCurrentSection('messages')
              }}
            >
              <span className="world-card-icon">💌</span>

              <h3>Messages</h3>

              <p>Leave Haneen a special message.</p>

              <span className="card-arrow">Write a message →</span>
            </button>

            <button
              className="world-card"
              onClick={() => setCurrentSection('memories')}
            >
              <span className="world-card-icon">📸</span>

              <h3>Memory Wall</h3>

              <p>Share a beautiful memory together.</p>

              <span className="card-arrow">See memories →</span>
            </button>
          </div>
        </section>

        <footer className="world-footer">
          <p>Made with love by Haneen 💗</p>

          <small>© 2026 Haneen's Birthday World</small>
        </footer>
      </main>
    </div>
  )
}

export default App
