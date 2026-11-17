import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import type { SelectOption } from './Select'

type MultiSelectProps = {
  label?: string
  options: readonly SelectOption[]
  value: readonly string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
  /** How many selected names show as chips before "+N more". */
  maxChips?: number
}

/** Dropdown with checkboxes. Selected items show as compact chips, which keeps forms short. */
export function MultiSelect({ label, options, value, onChange, placeholder = 'Select options', error, hint, disabled, className, maxChips = 2 }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? options.filter(option => option.label.toLowerCase().includes(term)) : options
  }, [options, query])
  const selected = options.filter(option => value.includes(option.value))
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter(item => item !== id) : [...value, id])

  return <div className={cn('block min-w-0', className)}>
    {label && <span className="mb-2 block text-[12px] font-extrabold text-[#474747]">{label}</span>}
    <Popover.Root open={open} onOpenChange={next => { setOpen(next); if (!next) setQuery('') }}>
      <Popover.Trigger asChild>
        <button type="button" disabled={disabled} aria-label={label} className={cn('flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#D9DADE] bg-white px-3.5 py-2 text-left text-sm font-semibold text-[#1E1E1E] outline-none transition hover:border-[#FF7F00] focus-visible:border-[#FF7F00] focus-visible:ring-4 focus-visible:ring-[#FF7F00]/10 disabled:opacity-55', open && 'border-[#FF7F00] ring-4 ring-[#FF7F00]/10', error && 'border-[#E52929]')}>
          {selected.length === 0
            ? <span className="truncate font-medium text-[#6D7176]">{placeholder}</span>
            : <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              {selected.slice(0, maxChips).map(option => <span key={option.value} className="inline-flex max-w-[140px] items-center gap-1 rounded-full bg-[#FFF1E4] py-0.5 pl-2.5 pr-1 text-[11px] font-extrabold text-[#AD5300]"><span className="truncate">{option.label}</span><span role="button" tabIndex={-1} aria-label={`Remove ${option.label}`} onClick={event => { event.stopPropagation(); toggle(option.value) }} className="rounded-full p-0.5 hover:bg-black/10"><X size={11}/></span></span>)}
              {selected.length > maxChips && <span className="text-[11px] font-extrabold text-[#6D7176]">+{selected.length - maxChips} more</span>}
            </span>}
          <ChevronDown size={16} className={cn('shrink-0 text-[#6D7176] transition-transform', open && 'rotate-180')}/>
        </button>
      </Popover.Trigger>
      <Popover.Content align="start" sideOffset={6} collisionPadding={12} onOpenAutoFocus={event => event.preventDefault()} className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[200px] overflow-hidden rounded-xl border border-[#E7E8EA] bg-white shadow-[0_18px_44px_rgba(30,30,30,.16)]">
        {options.length > 7 && <div className="flex items-center gap-2 border-b border-[#F0F1F2] px-3 py-2.5 text-[#6D7176]"><Search size={14}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search…" aria-label="Search options" className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#1E1E1E] outline-none placeholder:font-medium placeholder:text-[#6D7176]"/></div>}
        <div role="listbox" aria-multiselectable="true" className="flex max-h-60 flex-col gap-0.5 overflow-y-auto p-1.5">
          {visible.length === 0 && <p className="px-3 py-4 text-center text-xs font-medium text-[#6D7176]">No matches</p>}
          {visible.map(option => {
            const active = value.includes(option.value)
            return <button key={option.value} type="button" role="option" aria-selected={active} onClick={() => toggle(option.value)} className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[13px] font-semibold outline-none transition-colors hover:bg-[#F6F7F8] focus:bg-[#F6F7F8]', active ? 'text-[#AD5300]' : 'text-[#474747]')}>
              <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border', active ? 'border-[#FF7F00] bg-[#FF7F00] text-secondary-foreground' : 'border-[#C9CACE] bg-white')}>{active && <Check size={12} strokeWidth={3}/>}</span>
              <span className="min-w-0"><span className="block truncate">{option.label}</span>{option.hint && <span className="mt-0.5 block truncate text-[10px] font-medium text-[#6D7176]">{option.hint}</span>}</span>
            </button>
          })}
        </div>
      </Popover.Content>
    </Popover.Root>
    {error ? <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#C72D34]">{error}</span> : hint && <span className="mt-1.5 block text-[11px] text-[#6D7176]">{hint}</span>}
  </div>
}
