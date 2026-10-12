import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type FormEvent,
  } from 'react'
  import { supabase } from './supabase'
  import './AdminDashboard.css'
  
  type QuizQuestion = {
    en: { question: string; options: string[] }
    correctAnswer: number
  }
  
  type Props = {
    questions: QuizQuestion[]
  }
  
  type QuizResult = {
    id: string
    friend_name: string
    score: number
    total_questions: number
    answers: number[] | null
    created_at: string
  }
  
  type Msg = {
    id: string
    friend_name: string
    message: string
    created_at: string
  }
  
  type Wish = {
    id: string
    friend_name: string
    wish_text: string
    created_at: string
  }
  
  type Memory = {
    id: string
    friend_name: string
    caption: string | null
    image_path: string
    created_at: string
  }
  
  type Like = { id: string; memory_id: string }
  
  type Comment = {
    id: string
    memory_id: string
    friend_name: string
    comment: string
    created_at: string
  }
  
  type Friend = {
    id: string
    display_name: string
    created_at: string
    failed_attempts: number
    locked_until: string | null
  }
  
  type TabKey =
    | 'overview'
    | 'quiz'
    | 'messages'
    | 'wishes'
    | 'memories'
    | 'friends'
  
  const TABS: { key: TabKey; label: string; icon: string; color: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊', color: '#c81768' },
    { key: 'quiz', label: 'Quiz', icon: '🎀', color: '#7c3aed' },
    { key: 'messages', label: 'Messages', icon: '💌', color: '#0ea5e9' },
    { key: 'wishes', label: 'Wishes', icon: '🌟', color: '#f59e0b' },
    { key: 'memories', label: 'Memories', icon: '📸', color: '#10b981' },
    { key: 'friends', label: 'Friends', icon: '👭', color: '#ef4444' },
  ]
  
  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  function scoreClass(score: number, total: number) {
    const ratio = total > 0 ? score / total : 0
  
    if (ratio >= 0.7) return 'admin-badge good'
    if (ratio >= 0.4) return 'admin-badge mid'
    return 'admin-badge low'
  }
  
  function memoryUrl(path: string) {
    if (!supabase) return ''
  
    return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl
  }
  
  function AdminDashboard({ questions }: Props) {
    const [authState, setAuthState] = useState<
      'checking' | 'loggedOut' | 'ready'
    >('checking')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loginBusy, setLoginBusy] = useState(false)
    const [loginError, setLoginError] = useState('')
  
    const [tab, setTab] = useState<TabKey>('overview')
    const [dataStatus, setDataStatus] = useState<
      'loading' | 'ready' | 'error'
    >('loading')
  
    const [quiz, setQuiz] = useState<QuizResult[]>([])
    const [messages, setMessages] = useState<Msg[]>([])
    const [wishes, setWishes] = useState<Wish[]>([])
    const [memories, setMemories] = useState<Memory[]>([])
    const [likes, setLikes] = useState<Like[]>([])
    const [comments, setComments] = useState<Comment[]>([])
    const [friends, setFriends] = useState<Friend[]>([])
  
    const [openQuizId, setOpenQuizId] = useState<string | null>(null)
  
    // ---------- auth ----------
  
    useEffect(() => {
      const client = supabase
  
      if (!client) {
        setAuthState('loggedOut')
        return
      }
  
      let cancelled = false
  
      const check = async () => {
        const { data } = await client.auth.getSession()
  
        if (!data.session) {
          if (!cancelled) setAuthState('loggedOut')
          return
        }
  
        const { data: isAdmin, error } = await client.rpc('is_admin')
  
        if (cancelled) return
  
        setAuthState(!error && isAdmin === true ? 'ready' : 'loggedOut')
      }
  
      void check()
  
      return () => {
        cancelled = true
      }
    }, [])
  
    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
  
      const client = supabase
  
      if (!client) {
        setLoginError('Supabase is not connected')
        return
      }
  
      setLoginBusy(true)
      setLoginError('')
  
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
  
      if (error) {
        setLoginError('Wrong email or password')
        setLoginBusy(false)
        return
      }
  
      const { data: isAdmin } = await client.rpc('is_admin')
  
      if (isAdmin !== true) {
        await client.auth.signOut()
        setLoginError('This account is not an admin')
        setLoginBusy(false)
        return
      }
  
      setPassword('')
      setLoginBusy(false)
      setAuthState('ready')
    }
  
    const handleLogout = async () => {
      await supabase?.auth.signOut()
      setAuthState('loggedOut')
    }
  
    const backToSite = () => {
      window.location.hash = ''
    }
  
    // ---------- data ----------
  
    const loadAll = useCallback(async () => {
      const client = supabase
  
      if (!client) {
        setDataStatus('error')
        return
      }
  
      const [quizR, msgR, wishR, memR, likeR, comR, friendR] =
        await Promise.all([
          client
            .from('quiz_results')
            .select('id, friend_name, score, total_questions, answers, created_at')
            .order('created_at', { ascending: false }),
          client
            .from('messages')
            .select('id, friend_name, message, created_at')
            .order('created_at', { ascending: false }),
          client
            .from('birthday_wishes')
            .select('id, friend_name, wish_text, created_at')
            .order('created_at', { ascending: false }),
          client
            .from('memories')
            .select('id, friend_name, caption, image_path, created_at')
            .order('created_at', { ascending: false }),
          client.from('memory_likes').select('id, memory_id'),
          client
            .from('memory_comments')
            .select('id, memory_id, friend_name, comment, created_at')
            .order('created_at', { ascending: true }),
          client.rpc('admin_list_friends'),
        ])
  
      const results = [quizR, msgR, wishR, memR, likeR, comR, friendR]
  
      if (results.some((result) => result.error)) {
        console.error(
          'Dashboard load errors:',
          results.map((result) => result.error),
        )
        setDataStatus('error')
        return
      }
  
      setQuiz((quizR.data ?? []) as QuizResult[])
      setMessages((msgR.data ?? []) as Msg[])
      setWishes((wishR.data ?? []) as Wish[])
      setMemories((memR.data ?? []) as Memory[])
      setLikes((likeR.data ?? []) as Like[])
      setComments((comR.data ?? []) as Comment[])
      setFriends((friendR.data ?? []) as Friend[])
      setDataStatus('ready')
    }, [])
  
    useEffect(() => {
      if (authState === 'ready') {
        void loadAll()
      }
    }, [authState, loadAll])
  
    // ---------- actions ----------
  
    const deleteRow = async (
      table: 'messages' | 'birthday_wishes' | 'quiz_results' | 'memory_comments',
      id: string,
      question: string,
    ) => {
      const client = supabase
  
      if (!client) return
      if (!window.confirm(question)) return
  
      const { error } = await client.from(table).delete().eq('id', id)
  
      if (error) {
        console.error('Delete error:', error)
        alert('Could not delete. Please try again.')
        return
      }
  
      await loadAll()
    }
  
    const deleteMemory = async (memory: Memory) => {
      const client = supabase
  
      if (!client) return
  
      const confirmed = window.confirm(
        `Delete this photo from ${memory.friend_name}? Its likes and comments will be deleted too.`,
      )
  
      if (!confirmed) return
  
      const commentsResult = await client
        .from('memory_comments')
        .delete()
        .eq('memory_id', memory.id)
  
      const likesResult = await client
        .from('memory_likes')
        .delete()
        .eq('memory_id', memory.id)
  
      const memoryResult = await client
        .from('memories')
        .delete()
        .eq('id', memory.id)
  
      if (commentsResult.error || likesResult.error || memoryResult.error) {
        console.error(
          'Delete memory error:',
          commentsResult.error,
          likesResult.error,
          memoryResult.error,
        )
        alert('Could not delete the photo. Please try again.')
        return
      }
  
      const { error: fileError } = await client.storage
        .from('memories')
        .remove([memory.image_path])
  
      if (fileError) {
        console.error('Could not remove the file:', fileError)
      }
  
      await loadAll()
    }
  
    const cleanUnusedFiles = async () => {
      const client = supabase
  
      if (!client || dataStatus !== 'ready') return
  
      const { data, error } = await client.storage
        .from('memories')
        .list('', { limit: 1000 })
  
      if (error || !data) {
        console.error('Could not list files:', error)
        alert('Could not read the photo files.')
        return
      }
  
      const used = new Set(memories.map((memory) => memory.image_path))
  
      const unused = data
        .filter(
          (file) =>
            /\.(jpe?g|png|webp)$/i.test(file.name) && !used.has(file.name),
        )
        .map((file) => file.name)
  
      if (unused.length === 0) {
        alert('No unused photo files found ✨')
        return
      }
  
      const confirmed = window.confirm(
        `Delete ${unused.length} unused photo file(s) from storage?`,
      )
  
      if (!confirmed) return
  
      const { error: removeError } = await client.storage
        .from('memories')
        .remove(unused)
  
      alert(
        removeError
          ? 'Could not delete some files.'
          : `Deleted ${unused.length} unused file(s) 🧹`,
      )
    }
  
    const changePin = async (friend: Friend) => {
      const client = supabase
  
      if (!client) return
  
      const value = window.prompt(
        `New 4-digit PIN for ${friend.display_name}:`,
      )
  
      if (value === null) return
  
      if (!/^\d{4}$/.test(value.trim())) {
        alert('The PIN must be exactly 4 digits.')
        return
      }
  
      const { error } = await client.rpc('admin_set_friend_pin', {
        p_friend_id: friend.id,
        p_new_pin: value.trim(),
      })
  
      if (error) {
        console.error('PIN error:', error)
        alert('Could not change the PIN.')
        return
      }
  
      alert(`PIN changed for ${friend.display_name} ✅`)
      await loadAll()
    }
  
    const unlockFriend = async (friend: Friend) => {
      const client = supabase
  
      if (!client) return
  
      const { error } = await client.rpc('admin_unlock_friend', {
        p_friend_id: friend.id,
      })
  
      if (error) {
        console.error('Unlock error:', error)
        alert('Could not unlock the account.')
        return
      }
  
      await loadAll()
    }
  
    const deleteFriend = async (friend: Friend) => {
      const client = supabase
  
      if (!client) return
  
      const confirmed = window.confirm(
        `Delete the account of ${friend.display_name}? Her quiz result, messages and photos stay. She can create a new account with the same name.`,
      )
  
      if (!confirmed) return
  
      const { error } = await client.rpc('admin_delete_friend', {
        p_friend_id: friend.id,
      })
  
      if (error) {
        console.error('Delete friend error:', error)
        alert('Could not delete the account.')
        return
      }
  
      await loadAll()
    }
  
    // ---------- numbers ----------
  
    const stats = useMemo(() => {
      const takers = new Set(
        quiz.map((result) => result.friend_name.trim().toLowerCase()),
      )
  
      const average =
        quiz.length > 0
          ? quiz.reduce((sum, result) => sum + result.score, 0) / quiz.length
          : 0
  
      const topThree = [...quiz]
        .sort(
          (a, b) =>
            b.score - a.score || a.created_at.localeCompare(b.created_at),
        )
        .slice(0, 3)
  
      const perQuestion = questions.map((question, index) => {
        const answered = quiz.filter(
          (result) =>
            Array.isArray(result.answers) &&
            typeof result.answers[index] === 'number',
        )
  
        const correct = answered.filter(
          (result) => result.answers?.[index] === question.correctAnswer,
        ).length
  
        return {
          text: question.en.question,
          percent:
            answered.length > 0
              ? Math.round((correct / answered.length) * 100)
              : 0,
          answered: answered.length,
        }
      })
  
      return { takers: takers.size, average, topThree, perQuestion }
    }, [quiz, questions])
  
    const likesFor = (memoryId: string) =>
      likes.filter((like) => like.memory_id === memoryId).length
  
    const commentsFor = (memoryId: string) =>
      comments.filter((comment) => comment.memory_id === memoryId)
  
    // ---------- screens ----------
  
    if (authState === 'checking') {
      return (
        <main className="admin-center">
          <p className="admin-muted">Checking access... 🔐</p>
        </main>
      )
    }
  
    if (authState === 'loggedOut') {
      return (
        <main className="admin-center">
          <form className="admin-login" onSubmit={handleLogin}>
            <div className="admin-login-icon">🔐</div>
  
            <h1>Admin</h1>
  
            <p className="admin-muted">Only Haneen can come in 💗</p>
  
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="username"
              required
            />
  
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
  
            {loginError && <p className="admin-error">{loginError}</p>}
  
            <button type="submit" disabled={loginBusy}>
              {loginBusy ? 'Checking...' : 'Log in'}
            </button>
  
            <button
              type="button"
              className="admin-link"
              onClick={backToSite}
            >
              ← Back to the site
            </button>
          </form>
        </main>
      )
    }
  
    const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0]
  
    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <h1>Haneen's Dashboard 🎀</h1>
            <p className="admin-muted">Everything in one place</p>
          </div>
  
          <div className="admin-header-buttons">
            <button onClick={() => void loadAll()}>🔄 Refresh</button>
            <button onClick={backToSite}>🏠 Site</button>
            <button onClick={() => void handleLogout()}>Log out</button>
          </div>
        </header>
  
        <nav className="admin-tabs">
          {TABS.map((item) => (
            <button
              key={item.key}
              className={item.key === tab ? 'admin-tab active' : 'admin-tab'}
              style={{ ['--tab-color' as string]: item.color }}
              onClick={() => setTab(item.key)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
  
        {dataStatus === 'loading' && (
          <p className="admin-muted">Loading everything... ✨</p>
        )}
  
        {dataStatus === 'error' && (
          <p className="admin-error">
            Could not load the data. Make sure the admin SQL was run, then
            press Refresh.
          </p>
        )}
  
        {dataStatus === 'ready' && (
          <section
            className="admin-panel"
            style={{ ['--tab-color' as string]: activeTab.color }}
          >
            {/* ---------------- OVERVIEW ---------------- */}
            {tab === 'overview' && (
              <>
                <div className="admin-stats">
                  <div className="admin-stat">
                    <span>{friends.length}</span>
                    <small>Friends</small>
                  </div>
                  <div className="admin-stat">
                    <span>{stats.takers}</span>
                    <small>Took the quiz</small>
                  </div>
                  <div className="admin-stat">
                    <span>{stats.average.toFixed(1)}</span>
                    <small>Average score</small>
                  </div>
                  <div className="admin-stat">
                    <span>{messages.length}</span>
                    <small>Messages</small>
                  </div>
                  <div className="admin-stat">
                    <span>{wishes.length}</span>
                    <small>Wishes</small>
                  </div>
                  <div className="admin-stat">
                    <span>{memories.length}</span>
                    <small>Photos</small>
                  </div>
                  <div className="admin-stat">
                    <span>{comments.length}</span>
                    <small>Comments</small>
                  </div>
                  <div className="admin-stat">
                    <span>{likes.length}</span>
                    <small>Likes</small>
                  </div>
                </div>
  
                <h2>🏆 Top 3</h2>
  
                {stats.topThree.length === 0 ? (
                  <p className="admin-muted">No quiz results yet.</p>
                ) : (
                  <ol className="admin-top">
                    {stats.topThree.map((result, index) => (
                      <li key={result.id}>
                        <span>{['🥇', '🥈', '🥉'][index]}</span>
                        <strong>{result.friend_name}</strong>
                        <span
                          className={scoreClass(
                            result.score,
                            result.total_questions,
                          )}
                        >
                          {result.score}/{result.total_questions}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
  
                <h2>🎯 How hard was each question?</h2>
  
                <div className="admin-bars">
                  {stats.perQuestion.map((item, index) => (
                    <div className="admin-bar-row" key={index}>
                      <p>
                        {index + 1}. {item.text}
                      </p>
  
                      <div className="admin-bar">
                        <div
                          className="admin-bar-fill"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
  
                      <small>
                        {item.percent}% got it right ({item.answered} answers)
                      </small>
                    </div>
                  ))}
                </div>
              </>
            )}
  
            {/* ---------------- QUIZ ---------------- */}
            {tab === 'quiz' && (
              <>
                <h2>🎀 Quiz results ({quiz.length})</h2>
  
                <p className="admin-muted">
                  Tap a row to see every answer. Deleting a result lets that
                  friend take the quiz again.
                </p>
  
                {quiz.length === 0 ? (
                  <p className="admin-muted">Nothing here yet.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Friend</th>
                          <th>Score</th>
                          <th>When</th>
                          <th></th>
                        </tr>
                      </thead>
  
                      <tbody>
                        {quiz.map((result) => {
                          const isOpen = openQuizId === result.id
  
                          return (
                            <Fragment key={result.id}>
                              <tr
                                className="admin-row-clickable"
                                onClick={() =>
                                  setOpenQuizId(isOpen ? null : result.id)
                                }
                              >
                                <td>{result.friend_name}</td>
                                <td>
                                  <span
                                    className={scoreClass(
                                      result.score,
                                      result.total_questions,
                                    )}
                                  >
                                    {result.score}/{result.total_questions}
                                  </span>
                                </td>
                                <td>{formatDateTime(result.created_at)}</td>
                                <td>
                                  <button
                                    className="admin-danger"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      void deleteRow(
                                        'quiz_results',
                                        result.id,
                                        `Delete the quiz result of ${result.friend_name}? She will be able to take the quiz again.`,
                                      )
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
  
                              {isOpen && (
                                <tr>
                                  <td colSpan={4}>
                                    <ul className="admin-answers">
                                      {questions.map((question, index) => {
                                        const chosen =
                                          Array.isArray(result.answers) &&
                                          typeof result.answers[index] ===
                                            'number'
                                            ? result.answers[index]
                                            : null
  
                                        const isCorrect =
                                          chosen === question.correctAnswer
  
                                        return (
                                          <li
                                            key={index}
                                            className={
                                              isCorrect ? 'right' : 'wrong'
                                            }
                                          >
                                            {isCorrect ? '✅' : '❌'}{' '}
                                            {question.en.question}
                                            <br />
                                            <small>
                                              Her answer:{' '}
                                              {chosen === null
                                                ? '—'
                                                : question.en.options[chosen]}
                                              {!isCorrect &&
                                                ` · Correct: ${
                                                  question.en.options[
                                                    question.correctAnswer
                                                  ]
                                                }`}
                                            </small>
                                          </li>
                                        )
                                      })}
                                    </ul>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
  
            {/* ---------------- MESSAGES ---------------- */}
            {tab === 'messages' && (
              <>
                <h2>💌 Messages ({messages.length})</h2>
  
                {messages.length === 0 && (
                  <p className="admin-muted">No messages yet.</p>
                )}
  
                <div className="admin-cards">
                  {messages.map((item) => (
                    <article className="admin-card" key={item.id}>
                      <header>
                        <strong>{item.friend_name}</strong>
                        <small>{formatDateTime(item.created_at)}</small>
                      </header>
  
                      <p dir="auto">{item.message}</p>
  
                      <button
                        className="admin-danger"
                        onClick={() =>
                          void deleteRow(
                            'messages',
                            item.id,
                            'Delete this message?',
                          )
                        }
                      >
                        🗑️ Delete
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
  
            {/* ---------------- WISHES ---------------- */}
            {tab === 'wishes' && (
              <>
                <h2>🌟 Birthday wishes ({wishes.length})</h2>
  
                {wishes.length === 0 && (
                  <p className="admin-muted">No wishes yet.</p>
                )}
  
                <div className="admin-cards">
                  {wishes.map((item) => (
                    <article className="admin-card" key={item.id}>
                      <header>
                        <strong>{item.friend_name}</strong>
                        <small>{formatDateTime(item.created_at)}</small>
                      </header>
  
                      <p dir="auto">{item.wish_text}</p>
  
                      <button
                        className="admin-danger"
                        onClick={() =>
                          void deleteRow(
                            'birthday_wishes',
                            item.id,
                            'Delete this wish?',
                          )
                        }
                      >
                        🗑️ Delete
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
  
            {/* ---------------- MEMORIES ---------------- */}
            {tab === 'memories' && (
              <>
                <h2>📸 Memory wall ({memories.length})</h2>
  
                <button
                  className="admin-secondary"
                  onClick={() => void cleanUnusedFiles()}
                >
                  🧹 Clean unused photo files
                </button>
  
                {memories.length === 0 && (
                  <p className="admin-muted">No photos yet.</p>
                )}
  
                <div className="admin-memories">
                  {memories.map((memory) => (
                    <article className="admin-memory" key={memory.id}>
                      <img
                        src={memoryUrl(memory.image_path)}
                        alt={memory.caption ?? 'A shared memory'}
                        loading="lazy"
                      />
  
                      <div className="admin-memory-body">
                        <strong>{memory.friend_name}</strong>
                        <small>{formatDateTime(memory.created_at)}</small>
  
                        {memory.caption && <p dir="auto">{memory.caption}</p>}
  
                        <small>
                          🤍 {likesFor(memory.id)} · 💬{' '}
                          {commentsFor(memory.id).length}
                        </small>
  
                        {commentsFor(memory.id).length > 0 && (
                          <ul className="admin-comments">
                            {commentsFor(memory.id).map((comment) => (
                              <li key={comment.id} dir="auto">
                                <span>
                                  <strong>{comment.friend_name}</strong>{' '}
                                  {comment.comment}
                                </span>
  
                                <button
                                  className="admin-x"
                                  onClick={() =>
                                    void deleteRow(
                                      'memory_comments',
                                      comment.id,
                                      'Delete this comment?',
                                    )
                                  }
                                  aria-label="Delete comment"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
  
                        <button
                          className="admin-danger"
                          onClick={() => void deleteMemory(memory)}
                        >
                          🗑️ Delete photo
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
  
            {/* ---------------- FRIENDS ---------------- */}
            {tab === 'friends' && (
              <>
                <h2>👭 Friends ({friends.length})</h2>
  
                <p className="admin-muted">
                  You can reset a forgotten PIN or unlock an account that was
                  locked after wrong tries.
                </p>
  
                {friends.length === 0 ? (
                  <p className="admin-muted">No friends have joined yet.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Joined</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
  
                      <tbody>
                        {friends.map((friend) => {
                          const locked =
                            friend.locked_until !== null &&
                            new Date(friend.locked_until).getTime() > Date.now()
  
                          return (
                            <tr key={friend.id}>
                              <td>{friend.display_name}</td>
                              <td>{formatDateTime(friend.created_at)}</td>
                              <td>
                                {locked ? (
                                  <span className="admin-badge low">
                                    Locked
                                  </span>
                                ) : (
                                  <span className="admin-badge good">OK</span>
                                )}
                              </td>
                              <td className="admin-actions">
                                <button
                                  className="admin-secondary"
                                  onClick={() => void changePin(friend)}
                                >
                                  🔑 PIN
                                </button>
  
                                {locked && (
                                  <button
                                    className="admin-secondary"
                                    onClick={() => void unlockFriend(friend)}
                                  >
                                    🔓 Unlock
                                  </button>
                                )}
  
                                <button
                                  className="admin-danger"
                                  onClick={() => void deleteFriend(friend)}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
    )
  }
  
  export default AdminDashboard