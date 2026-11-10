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
    {label && <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{label}</span>}
    <Popover.Root open={open} onOpenChange={next => { setOpen(next); if (!next) setQuery('') }}>
      <Popover.Trigger asChild>
        <button type="button" disabled={disabled} aria-label={label} className={cn('flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#DCE7E0] bg-white px-3.5 py-2 text-left text-sm font-semibold text-[#09261C] outline-none transition hover:border-[#529661] focus-visible:border-[#529661] focus-visible:ring-4 focus-visible:ring-[#529661]/10 disabled:opacity-55', open && 'border-[#529661] ring-4 ring-[#529661]/10', error && 'border-[#E65A4F]')}>
          {selected.length === 0
            ? <span className="truncate font-medium text-[#9AABA3]">{placeholder}</span>
            : <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              {selected.slice(0, maxChips).map(option => <span key={option.value} className="inline-flex max-w-[140px] items-center gap-1 rounded-full bg-[#EEF6ED] py-0.5 pl-2.5 pr-1 text-[11px] font-extrabold text-[#2F6B3E]"><span className="truncate">{option.label}</span><span role="button" tabIndex={-1} aria-label={`Remove ${option.label}`} onClick={event => { event.stopPropagation(); toggle(option.value) }} className="rounded-full p-0.5 hover:bg-black/10"><X size={11}/></span></span>)}
              {selected.length > maxChips && <span className="text-[11px] font-extrabold text-[#60736A]">+{selected.length - maxChips} more</span>}
            </span>}
          <ChevronDown size={16} className={cn('shrink-0 text-[#7C8D85] transition-transform', open && 'rotate-180')}/>
        </button>
      </Popover.Trigger>
      <Popover.Content align="start" sideOffset={6} collisionPadding={12} onOpenAutoFocus={event => event.preventDefault()} className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[200px] overflow-hidden rounded-xl border border-[#E2EAE5] bg-white shadow-[0_18px_44px_rgba(9,38,28,.16)]">
        {options.length > 7 && <div className="flex items-center gap-2 border-b border-[#EDF1EF] px-3 py-2.5 text-[#7C8D85]"><Search size={14}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search…" aria-label="Search options" className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#09261C] outline-none placeholder:font-medium placeholder:text-[#9AABA3]"/></div>}
        <div role="listbox" aria-multiselectable="true" className="flex max-h-60 flex-col gap-0.5 overflow-y-auto p-1.5">
          {visible.length === 0 && <p className="px-3 py-4 text-center text-xs font-medium text-[#829189]">No matches</p>}
          {visible.map(option => {
            const active = value.includes(option.value)
            return <button key={option.value} type="button" role="option" aria-selected={active} onClick={() => toggle(option.value)} className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[13px] font-semibold outline-none transition-colors hover:bg-[#F3F7F4] focus:bg-[#F3F7F4]', active ? 'text-[#2F6B3E]' : 'text-[#34483F]')}>
              <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border', active ? 'border-[#529661] bg-[#529661] text-white' : 'border-[#CAD6CF] bg-white')}>{active && <Check size={12} strokeWidth={3}/>}</span>
              <span className="min-w-0"><span className="block truncate">{option.label}</span>{option.hint && <span className="mt-0.5 block truncate text-[10px] font-medium text-[#829189]">{option.hint}</span>}</span>
            </button>
          })}
        </div>
      </Popover.Content>
    </Popover.Root>
    {error ? <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{error}</span> : hint && <span className="mt-1.5 block text-[11px] text-[#7C8D85]">{hint}</span>}
  </div>
}
