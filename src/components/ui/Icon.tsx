import type { ReactNode } from 'react'

export type IconName =
  | 'grid' | 'box' | 'truck' | 'wallet' | 'chart' | 'settings' | 'help' | 'bell'
  | 'search' | 'plus' | 'arrow' | 'chevron' | 'location' | 'scale' | 'trash'
  | 'link' | 'user' | 'card' | 'check' | 'copy' | 'clock' | 'download' | 'more'
  | 'logout' | 'building' | 'bank' | 'shield' | 'close' | 'filter' | 'route'
  | 'eye' | 'eyeOff' | 'menu' | 'send' | 'arrowIn' | 'arrowOut'

/** The design's stroke icon set (24px grid, currentColor). */
export function Icon({ name, size = 20, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    box: <><path d="m21 8-9 5-9-5"/><path d="m3.3 7 8.7-5 8.7 5v10L12 22l-8.7-5Z"/><path d="M12 13v9"/></>,
    truck: <><path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88L4.2 7.06l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.6 2.25c-.8.4-1.3.9-1.3 1.75"/><path d="M12 17h.01"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    chevron: <path d="m9 10 3 3 3-3"/>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    scale: <><path d="M7 20h10"/><path d="M12 3v17"/><path d="M5 6h14"/><path d="m5 6-3 6h6L5 6Zm14 0-3 6h6l-3-6Z"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/><path d="M10 11v6M14 11v6"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 19v2h16v-2"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
    building: <><path d="M4 21V5l8-3 8 3v16M2 21h20"/><path d="M8 7h1m6 0h1M8 11h1m6 0h1M8 15h1m6 0h1M10 21v-4h4v4"/></>,
    bank: <><path d="m3 9 9-6 9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M2 18h20"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-5"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    arrowIn: <><path d="M17 7 7 17"/><path d="M17 17H7V7"/></>,
    arrowOut: <><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h10"/>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.4 3.3M6.6 6.6C3.8 8.3 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m3 3 18 18"/></>,
    filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
    route: <><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a2 2 0 0 0 2-2V8a2 2 0 0 1 2-2h1"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

