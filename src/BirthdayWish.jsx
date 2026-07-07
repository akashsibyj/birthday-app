import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import './App.css'

import photo1 from './assets/photos/photo1.jpg'
import photo2 from './assets/photos/photo2.jpg'
import photo3 from './assets/photos/photo3.jpg'
import photo4 from './assets/photos/photo4.jpg'
import photo5 from './assets/photos/photo5.jpg'
import photo6 from './assets/photos/photo6.jpg'
import photo7 from './assets/photos/photo7.jpg'
import photo8 from './assets/photos/photo8.jpg'

const photos = [
  { src: photo4, caption: '2 years old', location: 'Hyderabad' },
  { src: photo5, caption: '4 years old', location: 'Kavyooor Home' },
  { src: photo3, caption: "2004 — there's little me with you", location: 'Karuvatta' },
  { src: photo1, caption: '2023', location: 'Toronto Night' },
  { src: photo2, caption: '2023', location: 'Toronto Night' },
  { src: photo8, caption: 'Family reunion after 5 years', location: 'Kuwait' },
  { src: photo6, caption: "2024", location: 'Kuwait' },
  { src: photo7, caption: "2024", location: 'Kuwait' },
]

const STAR_COUNT = 110

const MAX_IMG_RETRIES = 3

function BirthdayWish() {
  const [index, setIndex] = useState(0)
  const [imgError, setImgError] = useState({})
  const [retryToken, setRetryToken] = useState({})
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [imgLoaded, setImgLoaded] = useState({})
  const touchStartX = useRef(null)
  const isAnimating = useRef(false)
  const stageRef = useRef(null)
  const tiltEnabled = useRef(false)
  const retryCounts = useRef({})
  const preloadedRef = useRef(new Set())

  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
      })),
    []
  )

  useEffect(() => {
    try {
      tiltEnabled.current =
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      tiltEnabled.current = false
    }
  }, [])

  useEffect(() => {
    const toPreload = [
      index,
      (index + 1) % photos.length,
      (index - 1 + photos.length) % photos.length,
    ]
    toPreload.forEach((i) => {
      if (preloadedRef.current.has(i)) return
      preloadedRef.current.add(i)
      const img = new window.Image()
      img.src = photos[i].src
      img.onload = () => setImgLoaded((prev) => ({ ...prev, [i]: true }))
      img.onerror = () => {}
    })
  }, [index])

  const goTo = useCallback((newIndex) => {
    if (isAnimating.current || photos.length === 0) return
    isAnimating.current = true
    setIndex((newIndex + photos.length) % photos.length)
    window.setTimeout(() => {
      isAnimating.current = false
    }, 500)
  }, [])

  const goNext = useCallback(() => goTo(index + 1), [goTo, index])
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined

    const WHEEL_THRESHOLD = 12
    let wheelCooldown = false

    const handleWheel = (e) => {
      try {
        const absX = Math.abs(e.deltaX)
        const absY = Math.abs(e.deltaY)

        // Only hijack predominantly horizontal gestures (trackpad swipe,
        // shift+wheel) so normal vertical page scrolling stays untouched.
        if (absX <= absY || absX < WHEEL_THRESHOLD) return

        e.preventDefault()

        if (wheelCooldown) return
        wheelCooldown = true
        window.setTimeout(() => {
          wheelCooldown = false
        }, 500)

        if (e.deltaX > 0) {
          goNext()
        } else {
          goPrev()
        }
      } catch {
        // Malformed/unsupported wheel event — ignore, no navigation
      }
    }

    stage.addEventListener('wheel', handleWheel, { passive: false })
    return () => stage.removeEventListener('wheel', handleWheel)
  }, [goNext, goPrev])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const SWIPE_THRESHOLD = 50
    if (deltaX > SWIPE_THRESHOLD) {
      goPrev()
    } else if (deltaX < -SWIPE_THRESHOLD) {
      goNext()
    }
    touchStartX.current = null
  }

  const handleImgLoad = useCallback((i) => {
    setImgLoaded((prev) => ({ ...prev, [i]: true }))
  }, [])

  const handleImgError = (i) => {
    const attempts = retryCounts.current[i] || 0

    if (attempts < MAX_IMG_RETRIES) {
      retryCounts.current[i] = attempts + 1
      const delay = 400 * (attempts + 1)
      window.setTimeout(() => {
        setRetryToken((prev) => ({ ...prev, [i]: (prev[i] || 0) + 1 }))
      }, delay)
    } else {
      setImgError((prev) => ({ ...prev, [i]: true }))
    }
  }

  const MAX_TILT_DEG = 9

  const handleMouseMove = (e) => {
    if (!tiltEnabled.current || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: relX * MAX_TILT_DEG * 2, y: relY * -MAX_TILT_DEG * 2 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  const getCardOffset = (cardIndex) => {
    const total = photos.length
    let offset = cardIndex - index
    if (offset > total / 2) offset -= total
    if (offset < -total / 2) offset += total
    return offset
  }

  return (
    <div className="app">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <clipPath id="card-shape-clip" clipPathUnits="objectBoundingBox">
            <path
              d="M 0,0.0619
                 Q 0,0 0.0867,0
                 L 0.40,0
                 C 0.44,0.02 0.46,0.10 0.5,0.135
                 C 0.54,0.10 0.56,0.02 0.60,0
                 L 0.9133,0
                 Q 1,0 1,0.0619
                 L 1,0.9381
                 Q 1,1 0.9133,1
                 L 0.0867,1
                 Q 0,1 0,0.9381
                 Z"
            />
          </clipPath>
        </defs>
      </svg>
      <div className="stars" aria-hidden="true">
        {stars.map((s) => (
          <span
            key={s.id}
            className="star"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="bg-numeral" aria-hidden="true">28</div>

      <header className="header">
        <p className="eyebrow">Icha</p>
        <h1 className="title">
          Happy
          <br />
          Birthday
        </h1>
        <p className="location-note">
          🍁 All the way from Kuwait to Canada — miles apart, close at heart.
        </p>
      </header>

      {photos.length === 0 ? (
        <div className="empty-state">No photos found. Add images to continue.</div>
      ) : (
        <div className="carousel-wrapper">
          <button
            className="nav-arrow nav-arrow-left"
            onClick={goPrev}
            aria-label="Previous photo"
            type="button"
          >
            &#8249;
          </button>

          <div
            className="carousel-stage"
            ref={stageRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {photos.map(({ src, caption, location }, i) => {
              const offset = getCardOffset(i)
              const isActive = offset === 0
              const absOffset = Math.abs(offset)

              if (absOffset > 2) return null

              const style = {
                '--offset': offset,
                '--abs-offset': absOffset,
                '--tilt-x': isActive ? `${tilt.x}deg` : '0deg',
                '--tilt-y': isActive ? `${tilt.y}deg` : '0deg',
                zIndex: photos.length - absOffset,
              }

              return (
                <div
                  key={i}
                  className={`photo-card ${isActive ? 'active' : ''}`}
                  style={style}
                  aria-hidden={!isActive}
                >
                  {imgError[i] ? (
                    <div className="img-fallback">Photo unavailable</div>
                  ) : (
                    <>
                      {!imgLoaded[i] && <div className="card-skeleton" aria-hidden="true" />}
                      <img
                        className={`card-photo${imgLoaded[i] ? ' loaded' : ''}`}
                        src={retryToken[i] ? `${src}?retry=${retryToken[i]}` : src}
                        alt={caption ? `${caption}, ${location}` : `Birthday memory ${i + 1}`}
                        loading="eager"
                        fetchPriority={isActive ? 'high' : absOffset === 1 ? 'auto' : 'low'}
                        onLoad={() => handleImgLoad(i)}
                        onError={() => handleImgError(i)}
                        draggable={false}
                      />
                    </>
                  )}
                  <div className="card-scrim" />
                  {imgLoaded[i] && (
                    <div className="overlay-bottom">
                      {caption ? (
                        <div className="card-caption">
                          <p className="caption-primary">{caption}</p>
                          {location && <p className="caption-location">{location}</p>}
                        </div>
                      ) : (
                        <div className="chip-lines">
                          <span className="chip-bar thick" />
                          <span className="chip-bar thin" />
                          <div className="chip-dash-row">
                            <span className="chip-dash" />
                            <span className="chip-tiny-dot" />
                            <span className="chip-dash" />
                            <span className="chip-tiny-dot" />
                            <span className="chip-dash" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            className="nav-arrow nav-arrow-right"
            onClick={goNext}
            aria-label="Next photo"
            type="button"
          >
            &#8250;
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <div className="dots-indicator" role="tablist" aria-label="Photo navigation">
          {photos.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? 'dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to photo ${i + 1}`}
              aria-selected={i === index}
              role="tab"
              type="button"
            />
          ))}
        </div>
      )}

      <footer className="quote-section">
        <blockquote className="quote">
          "Twenty-eight looks good on you — steady hands, sharper mind, and a heart
          that's still the same one we grew up with. Wishing you a year as strong
          and grounded as you've become."
        </blockquote>
        <p className="signature">With love, always — no matter the distance. 🎂🇨🇦</p>
      </footer>
    </div>
  )
}

export default BirthdayWish
