import { useState, useEffect, useRef } from 'react'
import './AuthGate.css'

const UNLOCK_KEY = 'birthday-unlocked'
const CORRECT_NAME = 'icha'

const VINE_BOOM_SRC = '/sounds/vine-boom.mp3'
const AMONG_US_SRC = '/sounds/among-us-role-reveal-sound.mp3'
const ANIME_WOW_SRC = '/sounds/anime-wow-sound-effect.mp3'

const SOUND_BY_STEP = {
  q1: VINE_BOOM_SRC,
  q2: AMONG_US_SRC,
  q3: VINE_BOOM_SRC,
}

function playSound(src) {
  try {
    const audio = new Audio(src)
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay blocked before any user interaction, or file missing —
        // not critical to the flow, so fail silently.
      })
    }
    return audio
  } catch {
    return null
  }
}

const MEME_BY_STEP = {
  q1: {
    src: '/cat-gun-meme.jpg',
    alt: 'Suspicious cat holding a gun, demanding answers',
    fallback: '🐱🔫',
  },
  q2: {
    src: '/cat-skeptical.jpg',
    alt: 'Skeptical cat side-eyeing you, unconvinced',
    fallback: '🐱🤨',
  },
  q3: {
    src: '/cat-gun-meme.jpg',
    alt: 'Suspicious cat holding a gun, demanding answers',
    fallback: '🐱🔫',
  },
  denied: {
    src: '/cat-gun-meme.jpg',
    alt: 'Suspicious cat holding a gun, demanding answers',
    fallback: '🐱🔫',
  },
}

function MemeImage({ step }) {
  const [broken, setBroken] = useState(false)
  const meme = MEME_BY_STEP[step] ?? MEME_BY_STEP.q1

  if (broken) {
    return (
      <div className="meme-fallback" role="img" aria-label={meme.alt}>
        {meme.fallback}
      </div>
    )
  }

  return (
    <img
      className="meme-img"
      src={meme.src}
      alt={meme.alt}
      onError={() => setBroken(true)}
      draggable={false}
    />
  )
}

function AuthGate({ onUnlock }) {
  const [step, setStep] = useState('q1')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)
  const [denyMessage, setDenyMessage] = useState('')
  const unlockedRef = useRef(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(UNLOCK_KEY) === 'true') {
        unlockedRef.current = true
        onUnlock()
      }
    } catch {
      // sessionStorage unavailable (e.g. private mode) — just show the gate
    }
  }, [onUnlock])

  useEffect(() => {
    if (unlockedRef.current) return undefined

    const src = SOUND_BY_STEP[step]
    if (!src) return undefined

    // Play once for this step. If the browser blocks autoplay (no user
    // interaction yet), it just silently doesn't play — no retry on the
    // next click, since that would replay it right as the user answers.
    playSound(src)
  }, [step])

  const resetToStart = () => {
    setStep('q1')
    setName('')
    setNameError(false)
  }

  const handleQ1 = (answer) => {
    if (answer) {
      setStep('q2')
    } else {
      setDenyMessage("The cat doesn't believe you. State your business again.")
      setStep('denied')
    }
  }

  const handleQ2 = (answer) => {
    if (answer) {
      setStep('q3')
    } else {
      setDenyMessage("Wait... you said you were my brother, but you're not Ashish? Suspicious. Try again.")
      setStep('denied')
    }
  }

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (name.trim().toLowerCase() === CORRECT_NAME) {
      unlockedRef.current = true
      playSound(ANIME_WOW_SRC)
      try {
        sessionStorage.setItem(UNLOCK_KEY, 'true')
      } catch {
        // ignore — unlock still works for this session in memory
      }
      onUnlock()
    } else {
      setNameError(true)
      window.setTimeout(() => setNameError(false), 600)
    }
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <MemeImage key={`meme-${step}`} step={step} />

        {step === 'q1' && (
          <div className="gate-question" key="q1">
            <h2>Are you my brother?</h2>
            <div className="gate-buttons">
              <button type="button" className="gate-btn yes" onClick={() => handleQ1(true)}>
                Yes
              </button>
              <button type="button" className="gate-btn no" onClick={() => handleQ1(false)}>
                No
              </button>
            </div>
          </div>
        )}

        {step === 'q2' && (
          <div className="gate-question" key="q2">
            <h2>Are you Ashish?</h2>
            <div className="gate-buttons">
              <button type="button" className="gate-btn yes" onClick={() => handleQ2(true)}>
                Yes
              </button>
              <button type="button" className="gate-btn no" onClick={() => handleQ2(false)}>
                No
              </button>
            </div>
          </div>
        )}

        {step === 'q3' && (
          <form className="gate-question" key="q3" onSubmit={handleNameSubmit}>
            <h2>Ok then, what do I call you?</h2>
            <input
              className={`gate-input ${nameError ? 'shake' : ''}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your name..."
              autoFocus
              autoComplete="off"
            />
            {nameError && <p className="gate-error">Nope. The cat is not convinced. Try again.</p>}
            <button type="submit" className="gate-btn yes gate-submit">
              Enter
            </button>
          </form>
        )}

        {step === 'denied' && (
          <div className="gate-question" key="denied">
            <h2 className="gate-denied-title">ACCESS DENIED</h2>
            <p className="gate-deny-message">{denyMessage}</p>
            <button type="button" className="gate-btn yes" onClick={resetToStart}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthGate
