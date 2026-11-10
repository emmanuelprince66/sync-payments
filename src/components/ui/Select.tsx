import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { cn } from '@/lib/cn'

export type SelectOption = { value: string; label: string; hint?: string; disabled?: boolean }

/** Lists longer than this get a search box. */
const SEARCH_THRESHOLD = 7

export type SelectProps = {
  label?: string
  options: readonly SelectOption[]
  /** Controlled value. Leave it out when using react-hook-form's register(). */
  value?: string
  defaultValue?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  name?: string
  className?: string
  /** Overrides for the trigger box, e.g. "h-10" in toolbars. */
  boxClassName?: string
  searchable?: boolean
  'aria-label'?: string
  onValueChange?: (value: string) => void
  /** react-hook-form's register() handlers receive a change-like event. */
  onChange?: (event: { target: { name?: string; value: string }; type: string }) => unknown
  onBlur?: (event: { target: { name?: string; value: string }; type: string }) => unknown
  ref?: Ref<HTMLInputElement>
}

/**
 * The app's dropdown, replacing native selects: styled list, search on long lists,
 * keyboard support, closes on an outside click or Escape. Works controlled
 * (value + onValueChange) or with react-hook-form's {...register('field')}.
 */
export function Select({ label, options, value, defaultValue = '', placeholder = 'Select an option', error, hint, disabled, name, className, boxClassName, searchable, onValueChange, onChange, onBlur, ref, ...rest }: SelectProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [internal, setInternal] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // A hidden input holds the value so register() can read and set it; writes (e.g. form.reset) update the display too.
  const attach = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element
    if (element) {
      const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!
      Object.defineProperty(element, 'value', {
        configurable: true,
        get: () => native.get!.call(element),
        set: (next: unknown) => { native.set!.call(element, next); setInternal(String(next ?? '')) },
      })
    }
    if (typeof ref === 'function') ref(element)
    else if (ref) ref.current = element
  }, [ref])

  const current = value !== undefined ? String(value) : internal
  const selected = options.find(option => option.value === current)
  const showSearch = searchable ?? options.length > SEARCH_THRESHOLD
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? options.filter(option => option.label.toLowerCase().includes(term)) : options
  }, [options, query])

  const pick = (next: string) => {
    if (inputRef.current) inputRef.current.value = next
    const event = { target: { name, value: next }, type: 'change' }
    onChange?.(event)
    onValueChange?.(next)
    onBlur?.({ ...event, type: 'blur' })
    setOpen(false)
    setQuery('')
  }

  const moveFocus = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
    if (!items.length) return
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
  }

  return <div className={cn('block min-w-0', className)}>
    {label && <label htmlFor={id} className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{label}</label>}
    <input ref={attach} type="hidden" name={name} defaultValue={value === undefined ? defaultValue : undefined} value={value !== undefined ? current : undefined} readOnly={value !== undefined}/>
    <Popover.Root open={open} onOpenChange={next => { setOpen(next); if (!next) setQuery('') }}>
      <Popover.Trigger asChild>
        <button id={id} type="button" disabled={disabled} aria-label={label ? undefined : rest['aria-label']} aria-invalid={error ? true : undefined} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}
          className={cn('flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#DCE7E0] bg-white px-3.5 text-left text-sm font-semibold text-[#09261C] outline-none transition hover:border-[#529661] focus-visible:border-[#529661] focus-visible:ring-4 focus-visible:ring-[#529661]/10 disabled:cursor-not-allowed disabled:opacity-55', open && 'border-[#529661] ring-4 ring-[#529661]/10', error && 'border-[#E65A4F]', boxClassName)}>
          <span className={cn('min-w-0 truncate', !selected && 'font-medium text-[#9AABA3]')}>{selected?.label ?? placeholder}</span>
          <ChevronDown size={16} className={cn('shrink-0 text-[#7C8D85] transition-transform', open && 'rotate-180')}/>
        </button>
      </Popover.Trigger>
      {/* Not portalled, so it scrolls and stacks correctly inside dialogs. */}
      <Popover.Content align="start" sideOffset={6} collisionPadding={12} onOpenAutoFocus={event => { if (!showSearch) { event.preventDefault(); listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"], button:not(:disabled)')?.focus() } }} onKeyDown={moveFocus}
        className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[180px] overflow-hidden rounded-xl border border-[#E2EAE5] bg-white shadow-[0_18px_44px_rgba(9,38,28,.16)]">
        {showSearch && <div className="flex items-center gap-2 border-b border-[#EDF1EF] px-3 py-2.5 text-[#7C8D85]"><Search size={14}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search…" aria-label="Search options" className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#09261C] outline-none placeholder:font-medium placeholder:text-[#9AABA3]"/></div>}
        <div ref={listRef} role="listbox" className="flex max-h-60 flex-col gap-0.5 overflow-y-auto p-1.5">
          {visible.length === 0 && <p className="px-3 py-4 text-center text-xs font-medium text-[#829189]">No matches</p>}
          {visible.map(option => {
            const active = option.value === current
            return <button key={option.value} type="button" role="option" aria-selected={active} disabled={option.disabled} onClick={() => pick(option.value)}
              className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold outline-none transition-colors disabled:opacity-45', active ? 'bg-[#EEF6ED] font-extrabold text-[#2F6B3E]' : 'text-[#34483F] hover:bg-[#F3F7F4] focus:bg-[#F3F7F4]')}>
              <span className="min-w-0"><span className="block truncate">{option.label}</span>{option.hint && <span className="mt-0.5 block truncate text-[10px] font-medium text-[#829189]">{option.hint}</span>}</span>
              {active && <Check size={15} className="shrink-0"/>}
            </button>
          })}
        </div>
      </Popover.Content>
    </Popover.Root>
    {error ? <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{error}</span> : hint && <span className="mt-1.5 block text-[11px] text-[#7C8D85]">{hint}</span>}
  </div>
}
