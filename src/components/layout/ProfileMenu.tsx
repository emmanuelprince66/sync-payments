import { ChevronDown, HelpCircle, LogOut, ShieldCheck, Shuffle, type LucideIcon } from 'lucide-react'
import { useRef } from 'react'
import { useDismiss } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { useTopbar } from './hooks'

function Avatar({ initials, className }: { initials: string; className: string }) {
  return <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary font-extrabold text-white', className)}>{initials}</span>
}

function Item({ icon: Icon, label, onClick, badge, danger }: { icon: LucideIcon; label: string; onClick: () => void; badge?: { text: string; ok: boolean }; danger?: boolean }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors', danger ? 'text-[#C72D34] hover:bg-[#FDEAEA]' : 'text-foreground/70 hover:bg-accent')}>
    <Icon size={15} className={cn('shrink-0', !danger && 'text-muted-foreground')}/>
    <span className="flex-1">{label}</span>
    {badge && <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', badge.ok ? 'bg-accent text-secondary' : 'bg-[#FFF6E4] text-[#A76700]')}>{badge.text}</span>}
  </button>
}

/** Profile dropdown in the top bar: who is signed in, KYC with tier, switch business, help, sign out. */
export function ProfileMenu() {
  const bar = useTopbar()
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, bar.menuOpen, bar.closeMenu)

  return <div ref={rootRef} className="relative">
    <button type="button" aria-label="Profile menu" aria-haspopup="menu" aria-expanded={bar.menuOpen} onClick={bar.toggleMenu} className={cn('flex h-10 items-center gap-2 rounded-xl px-1 transition-colors md:px-1.5 md:pr-2.5', bar.menuOpen ? 'bg-accent' : 'hover:bg-muted')}>
      <Avatar initials={bar.initials} className="h-8 w-8 text-[11px]"/>
      <span className="hidden flex-col items-start md:flex">
        <span className="max-w-[120px] truncate text-xs font-extrabold text-foreground">{bar.firstName || 'User'}</span>
        <span className="text-[10px] font-semibold text-muted-foreground">{bar.roleLabel}</span>
      </span>
      <ChevronDown size={15} className={cn('hidden text-muted-foreground transition-transform md:block', bar.menuOpen && 'rotate-180')}/>
    </button>

    {bar.menuOpen && <div role="menu" className="absolute right-0 top-12 z-40 w-[min(18rem,calc(100vw-2.5rem))] rounded-2xl border border-border bg-white p-1.5 shadow-[0_20px_50px_rgba(29,38,28,.18)]">
      <div className="flex items-center gap-3 rounded-xl bg-[#F4FAF5] px-3 py-3">
        <Avatar initials={bar.initials} className="h-10 w-10 text-xs"/>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold text-foreground">{bar.fullName || 'User'}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-muted-foreground">{bar.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold text-secondary">{bar.roleLabel}</span>
        </div>
      </div>
      <div className="mt-1 flex flex-col gap-0.5 py-1">
        <Item icon={ShieldCheck} label="KYC verification" onClick={bar.goToKyc} badge={bar.kycBadge}/>
        <Item icon={Shuffle} label="Switch business" onClick={bar.switchBusiness}/>
        <Item icon={HelpCircle} label="Help & support" onClick={bar.openHelp}/>
      </div>
      <div className="mx-2 border-t border-border"/>
      <div className="py-1"><Item icon={LogOut} label="Sign out" danger onClick={bar.signOut}/></div>
    </div>}
  </div>
}
