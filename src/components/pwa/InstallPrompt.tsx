import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { closeInstallSheet, openInstallSheet, useInstallPrompt } from './useInstallPrompt'

const DISMISS_KEY = 'syncpay.installPrompt.dismissedAt'
/** After "Not now" the sheet stays away this long on its own; the Install app button still opens it. */
const DISMISS_FOR_MS = 3 * 24 * 60 * 60 * 1000
/** The dashboard can open its own prompts once its data loads, so the sheet waits, then checks again. */
const SHOW_AFTER_MS = 5000

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_FOR_MS
  } catch {
    return false
  }
}

function rememberDismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* private mode / storage off: hide for this visit only */ }
}

/** Small inline icons, so the sheet looks the same in every app whatever icon set it uses. */
const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const DownloadIcon = ({ size = 18 }: { size?: number }) => <svg {...svg} width={size} height={size}><path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
const CloseIcon = () => <svg {...svg}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
const CheckIcon = () => <svg {...svg} width={12} height={12} strokeWidth={3}><path d="M20 6 9 17l-5-5"/></svg>
const ShareIcon = () => <svg {...svg} className="mx-0.5 inline -translate-y-px align-middle text-[#1367D8]"><path d="M12 2v13"/><path d="m16 6-4-4-4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>
const AddIcon = () => <svg {...svg} className="mx-0.5 inline -translate-y-px align-middle"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>

const BENEFITS = ['Opens in one tap from your home screen', 'Full screen, like any app', 'Free, no app store needed']

/** The iPhone steps, numbered, with the icons people actually see in Safari. */
function IosSteps() {
  const steps = [
    <>Tap <ShareIcon/> <b>Share</b> in Safari’s toolbar</>,
    <>Choose <AddIcon/> <b>Add to Home Screen</b></>,
    <>Tap <b>Add</b>. Sync Pay is now on your home screen.</>,
  ]
  return <ol className="mt-4 space-y-2.5">
    {steps.map((step, index) => <li key={index} className="flex items-center gap-3 rounded-2xl bg-[#F8FAF8] px-3 py-2.5 text-[13px] leading-snug text-[#242424]">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#242424] text-[11px] font-black text-white">{index + 1}</span>
      <span className="min-w-0">{step}</span>
    </li>)}
  </ol>
}

/**
 * "Get the Sync Pay app": a bottom sheet over a dimmed page (same as Sync Card's). It opens on its own a few
 * seconds in, only while no other dialog is open, and whenever the Install app button is tapped. Chrome/Edge
 * (Android, desktop) get a big Install button; iPhone/iPad Safari get the Share → Add to Home Screen steps.
 * Never shown once installed; "Not now" keeps it away for 3 days. Mounted once in main.tsx.
 */
export function InstallPrompt() {
  const { mode, requested, install } = useInstallPrompt()
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(dismissedRecently)
  const primary = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let id = 0
    const check = () => {
      if (document.querySelector('[role="dialog"]')) { id = window.setTimeout(check, 2000); return }
      setReady(true)
    }
    id = window.setTimeout(check, SHOW_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [])

  const open = Boolean(mode) && (requested || (ready && !dismissed))

  useEffect(() => {
    if (!open) return
    primary.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') notNow() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null

  function notNow() { rememberDismiss(); setDismissed(true); closeInstallSheet() }
  const onInstall = async () => {
    const outcome = await install()
    if (outcome === 'dismissed') notNow()
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
    <button type="button" aria-label="Close" tabIndex={-1} onClick={notNow} className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"/>
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
      className="relative w-full max-w-[440px] rounded-t-[28px] bg-white p-5 shadow-[0_-12px_50px_rgba(0,0,0,.25)] sm:rounded-[28px] sm:p-6"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
    >
      <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-black/15 sm:hidden" aria-hidden="true"/>
      <button type="button" onClick={notNow} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black">
        <CloseIcon/>
      </button>

      <div className="flex items-center gap-4 pr-8">
        <img src="/icons/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-[18px] border border-black/10 shadow-sm"/>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-black/45">Free app</p>
          <h2 id="install-title" className="mt-0.5 text-xl font-black leading-tight tracking-[-.02em] text-[#242424]">Get the Sync Pay app</h2>
        </div>
      </div>

      {mode === 'prompt'
        ? <>
          <ul className="mt-4 space-y-2">
            {BENEFITS.map(text => <li key={text} className="flex items-center gap-2.5 text-[13px] font-semibold text-black/75">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#FFF1E0] text-[#C25E00]"><CheckIcon/></span>{text}
            </li>)}
          </ul>
          <button ref={primary} type="button" onClick={() => { void onInstall() }} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#242424] text-[15px] font-black text-white transition hover:opacity-90 active:scale-[.98]">
            <DownloadIcon/> Install the app
          </button>
        </>
        : <>
          <p className="mt-3 text-[13px] leading-snug text-black/60">Add Sync Pay to your home screen in three taps. It opens full screen, like any app.</p>
          <IosSteps/>
          <button ref={primary} type="button" onClick={notNow} className="mt-5 flex h-[52px] w-full items-center justify-center rounded-full bg-[#242424] text-[15px] font-black text-white transition hover:opacity-90 active:scale-[.98]">Got it</button>
        </>}
      <button type="button" onClick={notNow} className="mt-2 h-10 w-full rounded-full text-[13px] font-extrabold text-black/55 hover:text-black">Not now</button>
    </section>
  </div>
}

/** Always-visible way back to the sheet: a bright pill for the app header. Hidden when installing isn't possible. */
export function InstallAppButton({ className }: { className?: string }) {
  const { mode } = useInstallPrompt()
  if (!mode) return null
  return <button type="button" onClick={openInstallSheet} className={cn('inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#FF7F00] px-3.5 text-xs font-black text-[#FFFFFF] shadow-[0_0_0_3px_rgba(0,0,0,.06)] transition hover:opacity-90 active:scale-[.98]', className)}>
    <DownloadIcon size={15}/><span>Install app</span>
  </button>
}
