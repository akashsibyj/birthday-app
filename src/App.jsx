import { useState, useCallback, useEffect } from 'react'
import AuthGate from './AuthGate'
import BirthdayWish from './BirthdayWish'
import Confetti from './Confetti'

const CONFETTI_DURATION = 3200

function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleUnlock = useCallback(() => {
    setUnlocked(true)
    setShowConfetti(true)
  }, [])

  useEffect(() => {
    if (!showConfetti) return undefined
    const timer = window.setTimeout(() => setShowConfetti(false), CONFETTI_DURATION)
    return () => window.clearTimeout(timer)
  }, [showConfetti])

  return (
    <>
      {showConfetti && <Confetti />}
      {unlocked ? <BirthdayWish /> : <AuthGate onUnlock={handleUnlock} />}
    </>
  )
}

export default App
