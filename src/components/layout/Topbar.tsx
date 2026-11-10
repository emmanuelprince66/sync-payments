import { Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMobileSidebar, useTopbar } from './hooks'
import { ProfileMenu } from './ProfileMenu'

/** Same bar on every screen (as in sync-shipping): greeting + business, notifications, profile. Pages carry their own titles. */
export function Topbar() {
  const bar = useTopbar()
  const { openMenu } = useMobileSidebar()
  return <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-md sm:px-5 md:px-8">
    <button type="button" aria-label="Open menu" onClick={openMenu} className="shrink-0 rounded-xl border border-border bg-white p-2.5 text-foreground hover:bg-muted lg:hidden"><Menu size={17}/></button>
    <div className="min-w-0 flex-1">
      {/* Phones: "Welcome back," sits above the name so the full name fits. */}
      {bar.firstName && <p className="text-[10px] font-semibold leading-none text-muted-foreground sm:hidden">Welcome back,</p>}
      <div className="mt-1 flex min-w-0 items-center gap-1.5 sm:mt-0 sm:gap-2">
        <p className="min-w-0 truncate text-sm font-extrabold text-foreground sm:text-[19px] sm:tracking-[-0.02em]">
          <span className="hidden sm:inline">Welcome back{bar.firstName && ', '}</span>
          {bar.firstName ? <span className="text-secondary">{bar.firstName}</span> : <span className="sm:hidden">Welcome back</span>}
        </p>
        {bar.verification && <button type="button" onClick={bar.goToKyc} className={cn('shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-extrabold sm:px-2 sm:text-[10px]', bar.verification.ok ? 'bg-accent text-secondary' : 'bg-[#FFF6E4] text-[#A76700]')}>{bar.verification.text}</button>}
      </div>
      <p className="hidden truncate text-[11px] font-semibold text-muted-foreground sm:block">{bar.businessName ? `Managing ${bar.businessName}` : 'Dashboard overview'} · {bar.date}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className="relative rounded-xl border border-border bg-white p-2.5 text-muted-foreground" role="status" aria-label={bar.unread > 0 ? `${bar.unread} unread notifications` : 'No unread notifications'}>
        <Bell size={17}/>{bar.unread > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#EC1B24] ring-2 ring-white"/>}
      </span>
      <span className="hidden h-7 w-px bg-border sm:block" aria-hidden="true"/>
      <ProfileMenu/>
    </div>
  </header>
}
