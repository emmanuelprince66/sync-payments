import { useEffect } from 'react'
import { preloadAppShell } from './pages'

/** While the user is on login/signup, fetch the app's code so there's no blank wait after signing in. */
export function usePreloadAppShell() {
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1200))
    idle(() => preloadAppShell())
  }, [])
}
