import { useCallback, useSyncExternalStore } from 'react'

/** Chrome/Edge's install event (not in the DOM typings). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

/*
 * The browser can fire beforeinstallprompt before React mounts, so the listener lives at module level
 * (this file is imported from main.tsx) and React subscribes to the stored event. The sheet's open state
 * lives here too, so any "Install app" button can open it, even after "Not now".
 */
let deferred: BeforeInstallPromptEvent | null = null
let installed = false
let sheetOpen = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(fn => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault() // keep Chrome's own mini-infobar away; we show our sheet instead
    deferred = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    sheetOpen = false
    notify()
  })
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Already opened from the home screen / as an installed app. */
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** iPhone/iPad Safari: no beforeinstallprompt, installs through Share → Add to Home Screen. */
export function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS 13+ reports itself as a Mac; touch points give it away.
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  // In-app browsers and Chrome/Firefox/Edge on iOS can't add to the home screen the same way.
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\//.test(ua)
  return ios && !otherBrowser && /Safari/.test(ua)
}

export type InstallMode = 'prompt' | 'ios' | null

/** Opens the install sheet from anywhere (an "Install app" button), ignoring an earlier "Not now". */
export const openInstallSheet = () => { sheetOpen = true; notify() }
export const closeInstallSheet = () => { sheetOpen = false; notify() }

/**
 * How the app can be installed here: 'prompt' (Chrome/Edge event), 'ios' (manual steps) or null (can't / already
 * installed), whether the sheet was opened on request, and install() for the Chrome/Edge dialog.
 */
export function useInstallPrompt() {
  const event = useSyncExternalStore(subscribe, () => deferred, () => null)
  const done = useSyncExternalStore(subscribe, () => installed, () => false)
  const requested = useSyncExternalStore(subscribe, () => sheetOpen, () => false)

  const mode: InstallMode = done || isStandalone() ? null : event ? 'prompt' : isIosSafari() ? 'ios' : null

  const install = useCallback(async () => {
    const current = deferred
    if (!current) return 'unavailable' as const
    await current.prompt()
    const { outcome } = await current.userChoice
    // The event can be used only once; Chrome fires a fresh one later if the user declined.
    deferred = null
    sheetOpen = false
    notify()
    return outcome
  }, [])

  return { mode, requested, install }
}
