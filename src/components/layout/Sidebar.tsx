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

const footerLink = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-foreground/60 hover:bg-accent hover:text-foreground'

/**
 * Active colours are inline and untransitioned: animating out of the hover state could leave
 * the background stuck transparent with the text already its final colour, hiding the link.
 */
const activeLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties | undefined =>
  isActive ? { backgroundColor: '#529661', color: '#FFFFFF' } : undefined

function MenuItem({ icon: Icon, label, danger, onClick }: { icon: LucideIcon; label: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors', danger ? 'text-[#C72D34] hover:bg-[#FDEAEA]' : 'text-foreground/70 hover:bg-accent')}>
    <Icon size={15}/>{label}
  </button>
}

/** The design's user row; opens Switch business / Log out upward. */
function AccountBlock({ model }: { model: SidebarModel }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useDismiss(rootRef, model.menuOpen, model.closeMenu)
  return <div ref={rootRef} className="relative mt-3 border-t border-border pt-4">
    <button type="button" aria-haspopup="menu" aria-expanded={model.menuOpen} onClick={model.toggleMenu} className="flex w-full items-center gap-3 rounded-xl px-2 text-left">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">{model.userInitials}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-extrabold text-foreground">{model.fullName}</span>
        <span className="block truncate text-[10px] text-muted-foreground">{model.businessName}</span>
      </span>
      <MoreHorizontal size={17} className="ml-auto shrink-0 text-muted-foreground"/>
    </button>
    {model.menuOpen && <div role="menu" className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-2xl border border-border bg-white p-1.5 shadow-[0_20px_50px_rgba(29,38,28,.18)]">
      <div className="rounded-xl bg-[#F4FAF5] px-3 py-2.5">
        <p className="truncate text-xs font-extrabold text-foreground">{model.fullName}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{model.email}</p>
        <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-secondary">{model.roleLabel}</p>
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
    {open && <button type="button" aria-label="Close menu" onClick={close} className="fixed inset-0 z-30 bg-primary/30 backdrop-blur-sm lg:hidden"/>}
    <aside
      ref={drawerRef}
      className={cn('fixed inset-y-0 left-0 z-40 flex w-[248px] max-w-[85vw] flex-col border-r border-border bg-white transition-transform duration-300 lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}
      style={{ backgroundImage: 'radial-gradient(circle, rgba(29,38,28,.055) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
    >
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-border px-5">
        <Logo/>
        <button type="button" aria-label="Close menu" onClick={close} className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"><X size={18}/></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {navItems.filter(item => canOpen(item.to)).map(({ id, label, icon: Icon, to }) => <NavLink
            key={id}
            to={to}
            end={to === paths.overview}
            onClick={close}
            className={({ isActive }) => cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold', isActive ? 'bg-secondary text-white shadow-[0_6px_16px_rgba(82,150,97,.22)]' : 'text-foreground/60 transition-colors hover:bg-accent hover:text-foreground')}
            style={activeLinkStyle}
          >
            {({ isActive }) => <>
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2}/>
              <span>{label}</span>
              {id === 'expenses' && model.pendingApprovals > 0 &&<span className={cn('ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] font-extrabold', isActive ? 'bg-white text-secondary' : 'bg-[#FFF1D2] text-[#A76700]')}>{model.pendingApprovals}</span>}
              {id === 'compliance' && verification.loaded && !verification.complete && <span className={cn('ml-auto h-2 w-2 rounded-full', isActive ? 'bg-white' : 'bg-[#E1A21A]')}/>}
            </>}
          </NavLink>)}
        </nav>
      </div>

      <div className="mt-auto shrink-0 border-t border-border bg-white/80 px-3 pb-4 pt-4 backdrop-blur-sm">
        {verification.loaded && !verification.complete && <button type="button" onClick={model.goToKyc} className="mx-1 mb-4 block w-[calc(100%-0.5rem)] rounded-2xl border border-secondary/20 bg-[#F4FAF5] p-4 text-left">
          <span className="mb-3 flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-white"><ShieldCheck size={16}/></span>
            <span className="text-[10px] font-extrabold text-secondary">{verification.percent}%</span>
          </span>
          <span className="block text-xs font-extrabold text-foreground">Finish verification</span>
          <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">Unlock higher payment limits and instant payouts.</span>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-secondary/15"><span className="block h-full rounded-full bg-secondary" style={{ width: `${verification.percent}%` }}/></span>
        </button>}
        <button type="button" onClick={model.openHelp} className={footerLink}><HelpCircle size={17}/> Help & support</button>
        <button type="button" onClick={model.openSettings} className={footerLink}><Settings size={17}/> Settings</button>
        <AccountBlock model={model}/>
      </div>
    </aside>
  </>
}
