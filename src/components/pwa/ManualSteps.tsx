import type { ReactNode } from 'react'
import type { ManualKind } from './useInstallPrompt'

/*
 * Hand-made install steps for browsers with no install dialog of their own (every iPhone browser, Firefox and
 * other Android browsers, Chrome after its own offer was dismissed). Sources: web.dev "Patterns for promoting
 * PWA installation"; Chrome for iOS can add web apps from its address-bar Share button since iOS 16.4; in
 * Safari on iOS 26, Share sits in the ••• menu next to the address bar unless the Bottom/Top tab layout is on.
 */

const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, className: 'mx-0.5 inline -translate-y-px align-middle' }
const Share = () => <svg {...svg} className={`${svg.className} text-[#1367D8]`}><path d="M12 2v13"/><path d="m16 6-4-4-4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>
const Add = () => <svg {...svg}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
const Dots = () => <svg {...svg}><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>
const DotsVertical = () => <svg {...svg}><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></svg>

const introFor = (kind: ManualKind, appName: string) => kind === 'in-app'
  ? `This page is open inside another app, which can’t add apps to your home screen. Open it in your browser first.`
  : `Add ${appName} to your home screen in a few taps. It opens full screen, like any app.`

function stepsFor(kind: ManualKind, appName: string): ReactNode[] {
  const done = <>Tap <b>Add</b>. {appName} is now on your home screen.</>
  switch (kind) {
    case 'ios-safari': return [
      <>Tap <Share/> <b>Share</b> in Safari. If you don’t see it, tap <Dots/> next to the address bar first.</>,
      <>Scroll down and choose <Add/> <b>Add to Home Screen</b>.</>,
      done,
    ]
    case 'ios-chrome': return [
      <>Tap <Share/> <b>Share</b> at the right of Chrome’s address bar.</>,
      <>Choose <Add/> <b>Add to Home Screen</b> (scroll down or tap <b>More</b> if needed).</>,
      done,
    ]
    case 'ios-other': return [
      <>Open the browser menu (<Dots/> or <b>☰</b>) and tap <Share/> <b>Share</b>.</>,
      <>Choose <Add/> <b>Add to Home Screen</b>.</>,
      done,
    ]
    case 'in-app': return [
      <>Tap <Dots/> or <DotsVertical/> at the top or bottom of the screen.</>,
      <>Choose <b>Open in Safari</b> or <b>Open in browser</b>.</>,
      <>Then add {appName} to your home screen from there.</>,
    ]
    case 'android': return [
      <>Tap <DotsVertical/> <b>the menu</b> at the top right of your browser.</>,
      <>Choose <b>Install app</b> or <Add/> <b>Add to Home screen</b>.</>,
      <>Tap <b>Install</b> (or <b>Add</b>). {appName} is now on your home screen.</>,
    ]
  }
}

/** The line above the steps. */
export function ManualIntro({ kind, appName }: { kind: ManualKind; appName: string }) {
  return <p className="mt-3 text-[13px] leading-snug text-black/60">{introFor(kind, appName)}</p>
}

/** The numbered steps for this browser. */
export function ManualSteps({ kind, appName, dark, bg, numberColour }: { kind: ManualKind; appName: string; dark: string; bg: string; numberColour: string }) {
  return <ol className="mt-4 space-y-2.5">
    {stepsFor(kind, appName).map((step, index) => <li key={index} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] leading-snug" style={{ background: bg, color: dark }}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black" style={{ background: dark, color: numberColour }}>{index + 1}</span>
      <span className="min-w-0">{step}</span>
    </li>)}
  </ol>
}
