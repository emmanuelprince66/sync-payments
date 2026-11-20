import { usePermissions } from '@/hooks/usePermissions'
import { HelpCircle, LogOut, MoreHorizontal, Settings, ShieldCheck, Shuffle, X, type LucideIcon } from 'lucide-react'
import { useRef, type CSSProperties } from 'react'
import { NavLink } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { useDismiss } from '@/hooks/useDismiss'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'
import { useMobileSidebar, useSidebar } from './hooks'
import { navItems } from './nav'

type SidebarModel = ReturnType<typeof useSidebar>

const footerLink = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-[#BFC1C4] transition-colors hover:bg-[#303030] hover:text-white'

/**
 * Active colours are inline and untransitioned: animating out of the hover state could leave
 * the background stuck transparent with the text already its final colour, hiding the link.
 */
const activeLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties | undefined =>
  isActive ? { backgroundColor: '#3A3A3A', color: '#FFFFFF' } : undefined

function MenuItem({ icon: Icon, label, danger, onClick }: { icon: LucideIcon; label: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors', danger ? 'text-[#C72D34] hover:bg-[#FFF0F0]' : 'text-foreground/70 hover:bg-accent')}>
    <Icon size={15}/>{label}
  </button>
}

/** The design's user row; opens Switch business / Log out upward. */
function AccountBlock({ model }: { model: SidebarModel }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, model.menuOpen, model.closeMenu)
  return <div ref={rootRef} className="relative mt-3 border-t border-[#3E3E3E] pt-4">
    <button type="button" aria-haspopup="menu" aria-expanded={model.menuOpen} onClick={model.toggleMenu} className="flex w-full items-center gap-3 rounded-xl px-2 text-left">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">{model.userInitials}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-extrabold text-white">{model.fullName}</span>
        <span className="block truncate text-[10px] text-[#A9AAAC]">{model.businessName}</span>
      </span>
      <MoreHorizontal size={17} className="ml-auto shrink-0 text-[#AAAAAA]"/>
    </button>
    {model.menuOpen && <div role="menu" className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-2xl border border-border bg-white p-1.5 shadow-[0_20px_50px_rgba(30,30,30,.18)]">
      <div className="rounded-xl bg-[#F6F7F8] px-3 py-2.5">
        <p className="truncate text-xs font-extrabold text-foreground">{model.fullName}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{model.email}</p>
        <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-brand">{model.roleLabel}</p>
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        <MenuItem icon={ShieldCheck} label="KYC verification" onClick={model.goToKyc}/>
        <MenuItem icon={Shuffle} label="Switch business" onClick={model.switchBusiness}/>
        <div className="mx-2 my-0.5 border-t border-border"/>
        <MenuItem icon={LogOut} label="Log out" danger onClick={model.signOut}/>
      </div>
    </div>}
  </div>
}

/** The design's sidebar: static on large screens, a slide-in drawer below that. */
export function Sidebar() {
  const model = useSidebar()
  const { open, close } = useMobileSidebar()
  const { canOpen } = usePermissions()
  const { verification } = model
  const drawerRef = useRef<HTMLElement>(null)
  // On large screens the sidebar is always there, so this only ever dismisses the drawer.
  useDismiss(drawerRef, open, close)

  return <>
    {open && <button type="button" aria-label="Close menu" onClick={close} className="fixed inset-0 z-30 bg-[#141414]/60 backdrop-blur-sm lg:hidden"/>}
    <aside
      ref={drawerRef}
      className={cn('fixed inset-y-0 left-0 z-40 flex w-[248px] max-w-[85vw] flex-col bg-[#242424] text-white shadow-[15px_0_50px_rgba(0,0,0,.24)] transition-transform lg:shadow-none duration-300 lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}
    >
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#3E3E3E] px-5">
        <Logo inverse/>
        <button type="button" aria-label="Close menu" onClick={close} className="rounded-lg p-2 text-white hover:bg-[#303030] lg:hidden"><X size={18}/></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#A9AAAC]">Workspace</p>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {navItems.filter(item => canOpen(item.to)).map(({ id, label, icon: Icon, to }) => <NavLink
            key={id}
            to={to}
            end={to === paths.overview}
            onClick={close}
            className={({ isActive }) => cn('relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold', isActive ? 'bg-[#3A3A3A] text-white before:absolute before:-left-3 before:h-[22px] before:w-[3px] before:rounded-r before:bg-secondary' : 'text-[#BFC1C4] transition-colors hover:bg-[#303030] hover:text-white')}
            style={activeLinkStyle}
          >
            {({ isActive }) => <>
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-secondary' : undefined}/>
              <span>{label}</span>
              {id === 'expenses' && model.pendingApprovals > 0 &&<span className={cn('ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] font-extrabold', 'bg-secondary text-secondary-foreground')}>{model.pendingApprovals}</span>}
              {id === 'compliance' && verification.loaded && !verification.complete && <span className={cn('ml-auto h-2 w-2 rounded-full', 'bg-secondary')}/>}
            </>}
          </NavLink>)}
        </nav>
      </div>

      <div className="mt-auto shrink-0 border-t border-[#3E3E3E] px-3 pb-4 pt-4">
        {/* The "Finish verification" card is removed: it took space from the menu on shorter screens.
            The dot on Compliance still shows verification isn't finished, and the Compliance page has the progress.
        {verification.loaded && !verification.complete && <button type="button" onClick={model.goToKyc} className="mx-1 mb-4 block w-[calc(100%-0.5rem)] rounded-xl border border-[#444444] bg-[#2D2D2D] p-4 text-left">
          <span className="mb-3 flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#44382D] text-secondary"><ShieldCheck size={16}/></span>
            <span className="text-[10px] font-extrabold text-secondary">{verification.percent}%</span>
          </span>
          <span className="block text-xs font-extrabold text-white">Finish verification</span>
          <span className="mt-1 block text-[10px] leading-4 text-[#AEB0B2]">Unlock higher payment limits and instant payouts.</span>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-secondary" style={{ width: `${verification.percent}%` }}/></span>
        </button>}
        */}
        <button type="button" onClick={model.openHelp} className={footerLink}><HelpCircle size={17}/> Help & support</button>
        <button type="button" onClick={model.openSettings} className={footerLink}><Settings size={17}/> Settings</button>
        <AccountBlock model={model}/>
      </div>
    </aside>
  </>
}
