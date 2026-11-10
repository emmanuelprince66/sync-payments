import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from './Icon'

/** Page title block: "text-xl font-black" title + small grey subtitle, with optional actions on the right. */
export function PageHeader({ title, subtitle, actions, className = 'mb-6 flex flex-wrap items-center justify-between gap-3' }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  return <div className={className}>
    <div><div className="text-xl font-black text-[#09261C]">{title}</div>{subtitle && <div className="mt-1 text-xs text-[#7C8D85]">{subtitle}</div>}</div>
    {actions}
  </div>
}

/** Search box with the leading search icon. Size/width differ per screen, so pass the design's classes. */
export function SearchInput({ value, onChange, placeholder, className, inputClassName, iconSize = 17 }: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Wrapper classes, e.g. "flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#DFE7E2] px-3 text-[#7B8B83]". */
  className: string
  /** Input classes, e.g. "w-full bg-transparent text-xs font-semibold outline-none". */
  inputClassName: string
  iconSize?: number
}) {
  return <label className={className}>
    <Icon name="search" size={iconSize}/>
    <input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} className={inputClassName}/>
  </label>
}

/** Pill-style segmented control (Items "Item list / Sales history", auth "Log in / Create account"). */
export function SegmentedTabs<T extends string>({ value, onChange, options, className, buttonClassName, inactiveClassName = 'text-[#718279]' }: {
  value: T
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
  /** Wrapper classes from the design. */
  className: string
  /** Base button classes from the design (active/inactive colours are applied for you). */
  buttonClassName: string
  /** Inactive text colour; the auth tabs use text-[#7A8B82]. */
  inactiveClassName?: string
}) {
  return <div role="tablist" className={className}>
    {options.map(option => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} onClick={() => onChange(option.value)} className={cn(buttonClassName, value === option.value ? 'bg-white text-[#286B43] shadow-sm' : inactiveClassName)}>{option.label}</button>)}
  </div>
}

/** Green check circle used on every success screen. */
export function SuccessIcon({ className }: { className?: string }) {
  return <div className={cn('mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E7F5E5] text-[#438352]', className)}><Icon name="check" size={30} stroke={2.5}/></div>
}

/** Small rounded square holding an icon (the design's most repeated element). Pass size/colour classes. */
export function IconTile({ icon, size = 19, className = 'flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]', stroke }: { icon: IconName; size?: number; className?: string; stroke?: number }) {
  return <div className={className}><Icon name={icon} size={size} stroke={stroke}/></div>
}

/** Label/value row with a divider, as in payment summaries. */
export function SummaryRow({ label, value, labelClassName = 'text-[#7D8D85]', valueClassName = 'font-extrabold text-[#193C2E]' }: { label: ReactNode; value: ReactNode; labelClassName?: string; valueClassName?: string }) {
  return <div className="flex justify-between text-xs"><span className={labelClassName}>{label}</span><span className={valueClassName}>{value}</span></div>
}

/** Image picker wrapper: hidden file input inside a clickable label. */
export function FilePicker({ accept, onFile, className, children }: { accept: string; onFile: (file: File) => void; className?: string; children: ReactNode }) {
  return <label className={cn('cursor-pointer', className)}>
    {children}
    <input type="file" accept={accept} className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = '' }}/>
  </label>
}
