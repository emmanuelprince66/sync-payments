import { useEffect, useState } from 'react'
import { AUTH_SLIDES, SLIDE_INTERVAL_MS } from '../constants'

/** Auto-rotating slide index for the brand panel. */
export function useAuthVisualSlides() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setSlide(current => (current + 1) % AUTH_SLIDES.length), SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  return { slides: AUTH_SLIDES, slide, current: AUTH_SLIDES[slide], goTo: setSlide }
}
