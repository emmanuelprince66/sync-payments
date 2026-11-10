import { Search, X } from 'lucide-react'
import type { ComponentProps, InputHTMLAttributes, ReactNode, Ref, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Modal, ModalTitle } from './Modal'
import { SampleDataBadge } from './misc'
import { KitStatCard } from './PaymentKit'
import { Skeleton } from './Skeleton'

/** More Payments-design pieces: stat tiles that keep long naira figures inside the grid, dialogs, search, filters, table styling. */

/** Long figures step down a size on phones and wrap rather than widen the grid. */
const tileClass = 'min-w-0 [overflow-wrap:anywhere] [&>div:first-child]:h-full max-sm:[&>div:first-child>p:first-of-type]:text-[18px]'

/** Stat card whose long figures stay inside the grid. */
export function StatTile(props: ComponentProps<typeof KitStatCard>) {
  return <div className={tileClass}><KitStatCard {...props}/></div>
}

/** Stat card backed by sample data because no endpoint exists yet. */
export function SampleStatTile(props: ComponentProps<typeof KitStatCard>) {
  return <div className={cn('relative', tileClass)}>
    <KitStatCard {...props}/>
    <SampleDataBadge className="absolute -top-2 right-2 !px-2 !py-0.5 !text-[8px]"/>
  </div>
}

export function StatTileSkeleton() {
  return <div className="rounded-xl border border-border bg-card p-5" aria-hidden="true">
    <div className="flex items-center justify-between"><Skeleton className="h-3 w-20"/><Skeleton className="h-9 w-9 rounded-xl"/></div>
    <Skeleton className="mt-3 h-7 w-24 max-w-full"/>
    <Skeleton className="mt-2 h-2.5 w-28 max-w-full"/>
  </div>
}

export function KitEmpty({ icon, title, note, action, className }: { icon?: ReactNode; title: string; note?: string; action?: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col items-center px-5 py-12 text-center', className)}>
    {icon && <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-accent text-secondary">{icon}</div>}
    <p className="text-sm font-extrabold text-foreground">{title}</p>
    {note && <p className="mt-1 max-w-sm text-[11px] leading-4 text-muted-foreground">{note}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
}

/** Design styling for DataTable: head tint, hover, and rows that act as the click target of a stretched button. */
export const kitTableClass = 'text-xs [&_thead_tr]:border-border [&_thead_tr]:bg-[#FAFBFA] [&_thead_tr]:text-muted-foreground [&_tbody_tr]:relative [&_tbody_tr]:border-border/70 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#F8FBF8]'

/** Goes on a row's button: stretches its click area over the whole row. */
export const stretchedButton = "after:absolute after:inset-0 after:content-['']"

const areaClass = 'min-h-20 w-full min-w-0 rounded-xl border border-border bg-[#F8FAF8] p-3 text-xs font-semibold outline-none focus:border-secondary aria-invalid:border-[#C72D34]'

export function KitTextarea({ label, error, className, ref, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; ref?: Ref<HTMLTextAreaElement> }) {
  return <label className={cn('block min-w-0', className)}>
    <span className="mb-1.5 block text-[10px] font-extrabold">{label}</span>
    <textarea ref={ref} aria-invalid={error ? true : undefined} className={areaClass} {...props}/>
    {error && <span role="alert" className="mt-1 block text-[10px] font-semibold text-[#C72D34]">{error}</span>}
  </label>
}

/** Amount input with the currency symbol inside it (the design's expense form). */
export function KitMoneyField({ label, symbol, error, className, ref, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; symbol: string; error?: string; ref?: Ref<HTMLInputElement> }) {
  return <label className={cn('block min-w-0', className)}>
    <span className="mb-1.5 block text-[10px] font-extrabold">{label}</span>
    <span className="relative block">
      <span className="absolute left-3 top-3 text-xs font-extrabold text-muted-foreground">{symbol}</span>
      <input ref={ref} inputMode="decimal" aria-invalid={error ? true : undefined} placeholder="0.00" className="h-11 w-full min-w-0 rounded-xl border border-border bg-[#F8FAF8] pl-7 pr-3 text-xs font-bold outline-none focus:border-secondary aria-invalid:border-[#C72D34]" {...props}/>
    </span>
    {error && <span role="alert" className="mt-1 block text-[10px] font-semibold text-[#C72D34]">{error}</span>}
  </label>
}

export function KitSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative min-w-0 flex-1">
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
    <input type="search" aria-label={placeholder} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-xl border border-border bg-[#F8FAF8] pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10"/>
  </label>
}

/** Pill row of filters: the design's Transactions toolbar. */
export function KitFilterPills<T extends string>({ value, options, onChange }: { value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <>{options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={cn('whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[11px] font-extrabold', value === option.value ? 'bg-primary text-white' : 'border border-border bg-white text-muted-foreground hover:bg-muted')}>{option.label}</button>)}</>
}

type KitModalProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  /** Small rounded icon beside the title. */
  icon?: ReactNode
  /** Rows between the header and the body (e.g. a stepper). */
  subheader?: ReactNode
  children: ReactNode
  /** Stays visible while the body scrolls, so save buttons are always reachable. */
  footer?: ReactNode
  panelClassName?: string
  /** Set when the content is its own padded layout. */
  bodyClassName?: string
}

/** The design's dialog: rounded panel, header with close, scrolling body, fixed footer. Fits a phone screen. */
export function KitModal({ open, onClose, title, description, icon, subheader, children, footer, panelClassName = 'max-w-xl', bodyClassName = 'p-6' }: KitModalProps) {
  return <Modal open={open} onClose={onClose} overlayClassName="bg-primary/40 p-4 backdrop-blur-sm" panelClassName={cn('flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl', panelClassName)}>
    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-secondary">{icon}</span>}
          <ModalTitle className="text-base font-extrabold">{title}</ModalTitle>
        </div>
        {description && <div className="mt-2 text-[11px] text-muted-foreground">{description}</div>}
      </div>
      <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={17}/></button>
    </div>
    {subheader && <div className="shrink-0 border-b border-border px-6 py-3">{subheader}</div>}
    <div className={cn('min-h-0 flex-1 overflow-y-auto', bodyClassName)}>{children}</div>
    {footer && <div className="flex shrink-0 justify-between gap-2 border-t border-border px-6 py-4">{footer}</div>}
  </Modal>
}
