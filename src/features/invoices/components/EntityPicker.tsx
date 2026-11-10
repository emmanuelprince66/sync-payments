import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type PickerOption = { value: string; label: string; hint?: string }

type Props = {
  value: string
  options: readonly PickerOption[]
  onChange: (value: string) => void
  /** Called with whatever was typed in the search box. */
  onCreate: (query: string) => void
  createLabel: string
  /** Label for the current value when it isn't among `options` (e.g. outside the latest server search). */
  selectedLabel?: string
  /** Server-side search: receives the typed text, and `options` are taken as already filtered. */
  onSearch?: (query: string) => void
  placeholder?: string
  /** Shown under the list, e.g. what items are for. */
  note?: string
  icon?: ReactNode
  loading?: boolean
  invalid?: boolean
  'aria-label': string
  triggerClassName?: string
  contentClassName?: string
}

/** Searchable picker with a "+ Create new …" row, for contacts and items (Xero-style). */
export function EntityPicker({ value, options, onChange, onCreate, createLabel, selectedLabel, onSearch, placeholder = '', note, icon, loading, invalid, triggerClassName, contentClassName, ...rest }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const label = options.find(option => option.value === value)?.label ?? (value ? selectedLabel : undefined)
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term && !onSearch ? options.filter(option => `${option.label} ${option.hint ?? ''}`.toLowerCase().includes(term)) : options
  }, [options, query, onSearch])

  const search = (next: string) => { setQuery(next); onSearch?.(next) }
  const close = () => { setOpen(false); search('') }
  const pick = (next: string) => { onChange(next); close() }
  const create = () => { const typed = query.trim(); close(); onCreate(typed) }

  const moveFocus = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    if (!buttons.length) return
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus()
  }

  return <Popover.Root open={open} onOpenChange={next => (next ? setOpen(true) : close())}>
    <Popover.Trigger asChild>
      <button type="button" aria-label={rest['aria-label']} aria-invalid={invalid ? true : undefined} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}
        className={cn('flex w-full min-w-0 items-center gap-2.5 text-left outline-none', triggerClassName)}>
        {icon && <span className="shrink-0 text-foreground/70">{icon}</span>}
        <span className={cn('min-w-0 flex-1 truncate', !label && 'font-medium text-muted-foreground')}>{label ?? placeholder}</span>
        <ChevronDown size={14} className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}/>
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content align="start" sideOffset={6} collisionPadding={12} onKeyDown={moveFocus}
        className={cn('z-[70] w-[min(var(--radix-popover-trigger-width),calc(100vw-24px))] min-w-[260px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-[#E2EAE5] bg-white shadow-[0_18px_44px_rgba(9,38,28,.16)]', contentClassName)}>
        <div className="flex items-center gap-2 border-b border-[#EDF1EF] px-3 py-2.5 text-muted-foreground">
          <Search size={14}/>
          <input autoFocus value={query} onChange={event => search(event.target.value)} placeholder="Search…" aria-label={`Search ${rest['aria-label'].toLowerCase()}`}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (visible.length === 1) pick(visible[0].value); else if (!visible.length) create() } }}
            className="w-full min-w-0 bg-transparent text-xs font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground"/>
        </div>
        <div ref={listRef} className="flex max-h-64 flex-col overflow-y-auto">
          <button type="button" onClick={create} className="flex w-full items-center gap-3 border-b border-[#EDF1EF] bg-[#F6F8F7] px-3.5 py-3 text-left text-xs font-extrabold text-secondary outline-none hover:bg-accent focus:bg-accent">
            <Plus size={15}/>{createLabel}{query.trim() && <span className="truncate font-semibold text-muted-foreground">“{query.trim()}”</span>}
          </button>
          <div role="listbox" className="flex flex-col gap-0.5 p-1.5">
            {loading && <p className="px-3 py-3 text-center text-xs text-muted-foreground">Loading…</p>}
            {!loading && visible.map(option => {
              const active = option.value === value
              return <button key={option.value} type="button" role="option" aria-selected={active} onClick={() => pick(option.value)}
                className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold outline-none', active ? 'bg-[#EEF6ED] font-extrabold text-[#2F6B3E]' : 'text-foreground hover:bg-[#F3F7F4] focus:bg-[#F3F7F4]')}>
                <span className="min-w-0"><span className="block truncate">{option.label}</span>{option.hint && <span className="mt-0.5 block truncate text-[10px] font-medium text-muted-foreground">{option.hint}</span>}</span>
                {active && <Check size={14} className="shrink-0"/>}
              </button>
            })}
            {!loading && !visible.length && query.trim() && <p className="px-3 py-3 text-center text-xs text-muted-foreground">No matches</p>}
          </div>
        </div>
        {note && <p className="border-t border-[#EDF1EF] px-4 py-4 text-center text-[11px] leading-5 text-muted-foreground">{note}</p>}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
}
