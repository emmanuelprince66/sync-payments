import { useEffect, useState } from 'react'

/** Counts down once per second; `restart` starts it again. */
export function useResendTimer(seconds: number) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining(value => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  return {
    remaining,
    canResend: remaining <= 0,
    label: `00:${String(Math.max(remaining, 0)).padStart(2, '0')}`,
    restart: () => setRemaining(seconds),
  }
}
