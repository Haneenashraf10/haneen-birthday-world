import { useState } from 'react'

type LoginProps = {
  onLogin: (name: string) => void
}

function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) return

    onLogin(trimmedName)
  }

  return (
    <main className="login-page">
      <div className="login-sparkles" aria-hidden="true">
        ✨ ✦ ✧
      </div>

      <div className="login-card">
        <div className="login-icon">🎀</div>

        <p className="login-welcome">Welcome to</p>

        <h1>Haneen's Birthday World 🎂</h1>

        <p className="login-subtitle">
          Before you enter, tell me your name 💗
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Your name</label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name..."
            autoComplete="off"
          />

          <button type="submit">
            Enter My Birthday World ✨
          </button>
        </form>

        <p className="login-note">
          Don't worry, this little world is just for my favorite people 💕
        </p>
      </div>
    </main>
  )
}

export default Login