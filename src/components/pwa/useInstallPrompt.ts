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

/**
 * Which hand-made steps install the app here, when the browser has no install event of its own:
 *  - 'ios-safari': Share in the toolbar → Add to Home Screen
 *  - 'ios-chrome': Share in the address bar → Add to Home Screen (Chrome on iPhone can since iOS 16.4)
 *  - 'ios-other':  menu → Share → Add to Home Screen (Edge, Firefox, Opera on iPhone)
 *  - 'in-app':     an app's built-in browser (Instagram, Facebook…): open the page in Safari / the browser first
 *  - 'android':    ⋮ menu → Install app / Add to Home screen (Firefox, Samsung, or Chrome after its own offer was dismissed)
 * Desktop browsers without the event get nothing: Chrome/Edge show their own install icon in the address bar.
 */
export type ManualKind = 'ios-safari' | 'ios-chrome' | 'ios-other' | 'in-app' | 'android'

export function manualKind(): ManualKind | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|Twitter|LinkedInApp|GSA\//.test(ua)
  // iPadOS 13+ reports itself as a Mac; touch points give it away.
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  if (ios) {
    if (inApp) return 'in-app'
    if (/CriOS/.test(ua)) return 'ios-chrome'
    if (/FxiOS|EdgiOS|OPiOS|OPT\//.test(ua)) return 'ios-other'
    return 'ios-safari'
  }
  if (/Android/.test(ua)) return inApp ? 'in-app' : 'android'
  return null
}

/** 'prompt': the browser's own install dialog is ready. 'manual': show the steps for this browser. */
export type InstallMode = 'prompt' | 'manual' | null

/** Opens the install sheet from anywhere (an "Install app" button), ignoring an earlier "Not now". */
export const openInstallSheet = () => { sheetOpen = true; notify() }
export const closeInstallSheet = () => { sheetOpen = false; notify() }

/**
 * How the app can be installed here, the manual steps to show when there is no install event, whether the
 * sheet was opened on request, and install() for the Chrome/Edge dialog.
 */
export function useInstallPrompt() {
  const event = useSyncExternalStore(subscribe, () => deferred, () => null)
  const done = useSyncExternalStore(subscribe, () => installed, () => false)
  const requested = useSyncExternalStore(subscribe, () => sheetOpen, () => false)

  const manual = manualKind()
  const mode: InstallMode = done || isStandalone() ? null : event ? 'prompt' : manual ? 'manual' : null

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

  return { mode, manual, requested, install }
}
