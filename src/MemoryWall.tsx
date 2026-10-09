import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type PointerEvent as ReactPointerEvent,
  } from 'react'
  import { supabase } from './supabase'
  
  type Memory = {
    id: string
    friend_name: string
    caption: string | null
    image_path: string
    created_at: string
  }
  
  type Like = {
    memory_id: string
    friend_name: string
  }
  
  type Comment = {
    id: string
    memory_id: string
    friend_name: string
    comment: string
    created_at: string
  }
  
  type MemoryWallProps = {
    name: string
    onBack: () => void
  }
  
  const MAX_SIDE = 1280
  
  const RATIOS = [
    { key: '4:5', label: 'Portrait', value: 4 / 5 },
    { key: '1:1', label: 'Square', value: 1 },
    { key: '16:9', label: 'Wide', value: 16 / 9 },
  ]
  
  // small tilts so the frames look hand-hung
  const TILTS = [-1.5, 1, -0.5, 1.5, 0, -1]
  
  type ImageSize = { width: number; height: number }
  
  // cx / cy = the point of the photo that sits in the middle of the frame (0 to 1)
  type CropState = { cx: number; cy: number; zoom: number }
  
  // the visible part of the photo, as fractions (0 to 1) of the original
  type CropArea = { x: number; y: number; w: number; h: number }
  
  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
  }
  
  // how big the photo is compared with the frame (1 = exactly fills it)
  function getFrameScale(size: ImageSize, ratio: number, zoom: number) {
    const imageRatio = size.width / size.height
  
    return {
      wFactor: Math.max(1, imageRatio / ratio) * zoom,
      hFactor: Math.max(1, ratio / imageRatio) * zoom,
    }
  }
  
  // keeps the photo always covering the whole frame
  function clampCrop(
    crop: CropState,
    size: ImageSize,
    ratio: number,
  ): CropState {
    const { wFactor, hFactor } = getFrameScale(size, ratio, crop.zoom)
  
    return {
      zoom: crop.zoom,
      cx: clamp(crop.cx, 0.5 / wFactor, 1 - 0.5 / wFactor),
      cy: clamp(crop.cy, 0.5 / hFactor, 1 - 0.5 / hFactor),
    }
  }
  
  // Cuts the chosen part out of the photo and shrinks it before uploading
  async function cropAndCompress(file: File, area: CropArea): Promise<Blob> {
    const bitmap = await createImageBitmap(file)
  
    const srcX = clamp(area.x, 0, 1) * bitmap.width
    const srcY = clamp(area.y, 0, 1) * bitmap.height
    const srcW = Math.min(area.w * bitmap.width, bitmap.width - srcX)
    const srcH = Math.min(area.h * bitmap.height, bitmap.height - srcY)
  
    const scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH))
    const outW = Math.max(1, Math.round(srcW * scale))
    const outH = Math.max(1, Math.round(srcH * scale))
  
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
  
    const context = canvas.getContext('2d')
  
    if (!context) {
      throw new Error('Canvas is not supported in this browser')
    }
  
    context.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, outW, outH)
    bitmap.close()
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Could not compress the image'))
          }
        },
        'image/jpeg',
        0.85,
      )
    })
  }
  
  function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  }
  
  function imageUrl(path: string) {
    if (!supabase) return ''
  
    return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl
  }
  
  function MemoryWall({ name, onBack }: MemoryWallProps) {
    const myName = name.trim()
  
    const [memories, setMemories] = useState<Memory[]>([])
    const [likes, setLikes] = useState<Like[]>([])
    const [comments, setComments] = useState<Comment[]>([])
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
      'loading',
    )
  
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [caption, setCaption] = useState('')
    const [inputKey, setInputKey] = useState(0)
    const [imageSize, setImageSize] = useState<ImageSize | null>(null)
    const [ratioKey, setRatioKey] = useState('4:5')
    const [crop, setCrop] = useState<CropState>({ cx: 0.5, cy: 0.5, zoom: 1 })
    const dragRef = useRef<{
      x: number
      y: number
      cx: number
      cy: number
    } | null>(null)
    const [posting, setPosting] = useState<'idle' | 'posting' | 'error'>(
      'idle',
    )
  
    const [openId, setOpenId] = useState<string | null>(null)
  
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
      {},
    )
  
    useEffect(() => {
      if (!openId) return
  
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setOpenId(null)
        }
      }
  
      window.addEventListener('keydown', handleKeyDown)
  
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
  
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = previousOverflow
      }
    }, [openId])
  
    const loadWall = useCallback(async () => {
      if (!supabase) {
        console.error(
          'Supabase is not connected. Check .env.local and restart npm.cmd run dev.',
        )
        setStatus('error')
        return
      }
  
      const [memoriesResult, likesResult, commentsResult] = await Promise.all([
        supabase
          .from('memories')
          .select('id, friend_name, caption, image_path, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('memory_likes').select('memory_id, friend_name'),
        supabase
          .from('memory_comments')
          .select('id, memory_id, friend_name, comment, created_at')
          .order('created_at', { ascending: true }),
      ])
  
      if (
        memoriesResult.error ||
        likesResult.error ||
        commentsResult.error
      ) {
        console.error(
          'Error loading memory wall:',
          memoriesResult.error,
          likesResult.error,
          commentsResult.error,
        )
        setStatus('error')
        return
      }
  
      setMemories((memoriesResult.data ?? []) as Memory[])
      setLikes((likesResult.data ?? []) as Like[])
      setComments((commentsResult.data ?? []) as Comment[])
      setStatus('ready')
    }, [])
  
    useEffect(() => {
      void loadWall()
    }, [loadWall])
  
    const ratio = RATIOS.find((item) => item.key === ratioKey)?.value ?? 4 / 5
  
    const frameScale = imageSize
      ? getFrameScale(imageSize, ratio, crop.zoom)
      : null
  
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const picked = event.target.files?.[0]
  
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
  
      setFile(null)
      setPreviewUrl(null)
      setImageSize(null)
  
      if (!picked) return
  
      if (!picked.type.startsWith('image/')) {
        alert('Please choose a photo 💗')
        setInputKey((value) => value + 1)
        return
      }
  
      try {
        const bitmap = await createImageBitmap(picked)
        const size = { width: bitmap.width, height: bitmap.height }
        bitmap.close()
  
        setImageSize(size)
        setCrop({ cx: 0.5, cy: 0.5, zoom: 1 })
        setFile(picked)
        setPreviewUrl(URL.createObjectURL(picked))
      } catch (error) {
        console.error('Could not read the photo:', error)
        alert('Sorry, this photo format is not supported. Try another one 💗')
        setInputKey((value) => value + 1)
      }
    }
  
    const handleRatioChange = (key: string) => {
      const next = RATIOS.find((item) => item.key === key)
  
      if (!next) return
  
      setRatioKey(key)
  
      if (imageSize) {
        setCrop((current) => clampCrop(current, imageSize, next.value))
      }
    }
  
    const handleZoomChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (!imageSize) return
  
      const zoom = Number(event.target.value)
  
      setCrop((current) =>
        clampCrop({ ...current, zoom }, imageSize, ratio),
      )
    }
  
    const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
  
      dragRef.current = {
        x: event.clientX,
        y: event.clientY,
        cx: crop.cx,
        cy: crop.cy,
      }
    }
  
    const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
  
      if (!drag || !imageSize) return
  
      const rect = event.currentTarget.getBoundingClientRect()
      const { wFactor, hFactor } = getFrameScale(imageSize, ratio, crop.zoom)
  
      const cx = drag.cx - (event.clientX - drag.x) / (rect.width * wFactor)
      const cy = drag.cy - (event.clientY - drag.y) / (rect.height * hFactor)
  
      setCrop((current) =>
        clampCrop({ ...current, cx, cy }, imageSize, ratio),
      )
    }
  
    const handleDragEnd = () => {
      dragRef.current = null
    }
  
    const handlePost = async () => {
      if (!file || !imageSize) {
        alert('Choose a photo first 📸')
        return
      }
  
      if (!supabase) {
        console.error(
          'Supabase is not connected. Check .env.local and restart npm.cmd run dev.',
        )
        setPosting('error')
        return
      }
  
      setPosting('posting')
  
      try {
        const { wFactor, hFactor } = getFrameScale(imageSize, ratio, crop.zoom)
        const visibleW = 1 / wFactor
        const visibleH = 1 / hFactor
  
        const blob = await cropAndCompress(file, {
          x: crop.cx - visibleW / 2,
          y: crop.cy - visibleH / 2,
          w: visibleW,
          h: visibleH,
        })
        const path = `${crypto.randomUUID()}.jpg`
  
        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(path, blob, { contentType: 'image/jpeg' })
  
        if (uploadError) throw uploadError
  
        const { error: insertError } = await supabase
          .from('memories')
          .insert({
            friend_name: myName,
            caption: caption.trim() || null,
            image_path: path,
          })
  
        if (insertError) throw insertError
  
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
  
        setFile(null)
        setPreviewUrl(null)
        setImageSize(null)
        setCrop({ cx: 0.5, cy: 0.5, zoom: 1 })
        setCaption('')
        setInputKey((value) => value + 1)
        setPosting('idle')
  
        await loadWall()
      } catch (error) {
        console.error('Error posting memory:', error)
        setPosting('error')
      }
    }
  
    const handleLike = async (memoryId: string) => {
      if (!supabase) return
  
      const alreadyLiked = likes.some(
        (like) =>
          like.memory_id === memoryId &&
          like.friend_name.toLowerCase() === myName.toLowerCase(),
      )
  
      if (alreadyLiked) return
  
      // show the like immediately, then save it
      setLikes((current) => [
        ...current,
        { memory_id: memoryId, friend_name: myName },
      ])
  
      const { error } = await supabase
        .from('memory_likes')
        .insert({ memory_id: memoryId, friend_name: myName })
  
      // 23505 = this name already liked it, so keep the like
      if (error && error.code !== '23505') {
        console.error('Error saving like:', error)
  
        setLikes((current) =>
          current.filter(
            (like) =>
              !(like.memory_id === memoryId && like.friend_name === myName),
          ),
        )
      }
    }
  
    const handleComment = async (memoryId: string) => {
      const text = (commentDrafts[memoryId] ?? '').trim()
  
      if (!text || !supabase) return
  
      const { error } = await supabase.from('memory_comments').insert({
        memory_id: memoryId,
        friend_name: myName,
        comment: text,
      })
  
      if (error) {
        console.error('Error saving comment:', error)
        alert('Could not send your comment. Please try again 💗')
        return
      }
  
      setCommentDrafts((current) => ({ ...current, [memoryId]: '' }))
  
      await loadWall()
    }
  
    const openMemory = memories.find((memory) => memory.id === openId) ?? null
  
    const openLikes = openMemory
      ? likes.filter((like) => like.memory_id === openMemory.id)
      : []
  
    const openLiked = openLikes.some(
      (like) => like.friend_name.toLowerCase() === myName.toLowerCase(),
    )
  
    const openComments = openMemory
      ? comments.filter((comment) => comment.memory_id === openMemory.id)
      : []
  
    return (
      <div className="app">
        <main className="wall-page">
          <div className="wall-header">
            <button className="back-button" onClick={onBack}>
              ← Back to my world
            </button>
  
            <div className="quiz-icon">📸</div>
  
            <h1>Memory Wall</h1>
  
            <p className="message-note">
              Share a photo and a few words about a beautiful memory with
              Haneen. 💗
            </p>
          </div>
  
          <section className="wall-form">
            <label className="wall-file-button">
              📷 {file ? 'Change photo' : 'Choose a photo'}
  
              <input
                key={inputKey}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
            </label>
  
            {previewUrl && imageSize && frameScale && (
              <div className="crop-box">
                <div className="crop-ratios">
                  {RATIOS.map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      className={
                        item.key === ratioKey
                          ? 'crop-ratio active'
                          : 'crop-ratio'
                      }
                      onClick={() => handleRatioChange(item.key)}
                    >
                      {item.label} {item.key}
                    </button>
                  ))}
                </div>
  
                <div
                  className="crop-frame"
                  style={{ aspectRatio: ratio }}
                  onPointerDown={handleDragStart}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  onPointerCancel={handleDragEnd}
                >
                  <img
                    className="crop-image"
                    src={previewUrl}
                    alt="Drag to choose the visible part"
                    draggable={false}
                    style={{
                      width: `${frameScale.wFactor * 100}%`,
                      height: `${frameScale.hFactor * 100}%`,
                      left: `${(0.5 - crop.cx * frameScale.wFactor) * 100}%`,
                      top: `${(0.5 - crop.cy * frameScale.hFactor) * 100}%`,
                    }}
                  />
                </div>
  
                <label className="crop-zoom">
                  🔍 Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={crop.zoom}
                    onChange={handleZoomChange}
                  />
                </label>
  
                <p className="crop-hint">
                  Drag the photo to choose the part that will show on the
                  wall ✨
                </p>
              </div>
            )}
  
            <textarea
              className="message-input"
              dir="auto"
              rows={3}
              maxLength={300}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Tell us about this memory... (optional)"
            />
  
            {posting === 'error' && (
              <p className="message-error">
                Something went wrong. Please try again.
              </p>
            )}
  
            <button
              className="quiz-button"
              onClick={handlePost}
              disabled={posting === 'posting'}
            >
              {posting === 'posting' ? 'Uploading...' : 'Share memory 💗'}
            </button>
          </section>
  
          <section className="wall-list">
            {status === 'loading' && (
              <p className="message-note">Loading memories... ✨</p>
            )}
  
            {status === 'error' && (
              <p className="message-error">
                Could not load the wall. Please refresh the page.
              </p>
            )}
  
            {status === 'ready' && memories.length === 0 && (
              <p className="message-note">
                No memories yet. Be the first to share one! 🎀
              </p>
            )}
  
            {status === 'ready' && memories.length > 0 && (
              <div className="wall-board">
                <div className="wall-grid">
                  {memories.map((memory, index) => {
                    const likeCount = likes.filter(
                      (like) => like.memory_id === memory.id,
                    ).length
  
                    const commentCount = comments.filter(
                      (comment) => comment.memory_id === memory.id,
                    ).length
  
                    return (
                      <div
                        className="wall-hanging"
                        key={memory.id}
                        style={{
                          transform: `rotate(${TILTS[index % TILTS.length]}deg)`,
                        }}
                      >
                        <span className="wall-nail" />
  
                        <svg
                          className="wall-string"
                          viewBox="0 0 100 24"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <polyline
                            points="12,24 50,2 88,24"
                            fill="none"
                            stroke="#d9a7bd"
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
  
                        <button
                          type="button"
                          className="wall-frame"
                          onClick={() => setOpenId(memory.id)}
                          aria-label={`Open the memory shared by ${memory.friend_name}`}
                        >
                          <img
                            className="wall-image"
                            src={imageUrl(memory.image_path)}
                            alt={memory.caption ?? 'A shared memory'}
                            loading="lazy"
                          />
                        </button>
  
                        <p className="wall-plaque">
                          🤍 {likeCount} · 💬 {commentCount}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
  
          {openMemory && (
            <div
              className="wall-modal-backdrop"
              onClick={() => setOpenId(null)}
            >
              <div
                className="wall-modal"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="wall-modal-close"
                  onClick={() => setOpenId(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
  
                <img
                  className="wall-image"
                  src={imageUrl(openMemory.image_path)}
                  alt={openMemory.caption ?? 'A shared memory'}
                />
  
                <div className="wall-card-body">
                  {openMemory.caption && (
                    <p className="wall-caption" dir="auto">
                      {openMemory.caption}
                    </p>
                  )}
  
                  <p className="wall-meta">
                    Shared by {openMemory.friend_name} ·{' '}
                    {formatDate(openMemory.created_at)}
                  </p>
  
                  <button
                    className={openLiked ? 'wall-like liked' : 'wall-like'}
                    onClick={() => handleLike(openMemory.id)}
                  >
                    {openLiked ? '💗' : '🤍'} {openLikes.length}
                  </button>
  
                  {openLikes.length > 0 && (
                    <p className="wall-likers" dir="auto">
                      Liked by{' '}
                      {openLikes.map((like) => like.friend_name).join(', ')}
                    </p>
                  )}
  
                  <h3 className="wall-comments-title">
                    💬 Comments ({openComments.length})
                  </h3>
  
                  {openComments.length > 0 && (
                    <ul className="wall-comments">
                      {openComments.map((comment) => (
                        <li key={comment.id} dir="auto">
                          <strong>{comment.friend_name}</strong>{' '}
                          {comment.comment}
                        </li>
                      ))}
                    </ul>
                  )}
  
                  <div className="wall-comment-form">
                    <input
                      className="wall-comment-input"
                      dir="auto"
                      maxLength={300}
                      value={commentDrafts[openMemory.id] ?? ''}
                      onChange={(event) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [openMemory.id]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          void handleComment(openMemory.id)
                        }
                      }}
                      placeholder="Write a comment..."
                    />
  
                    <button
                      className="wall-comment-send"
                      onClick={() => handleComment(openMemory.id)}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }
  
  export default MemoryWall
  
