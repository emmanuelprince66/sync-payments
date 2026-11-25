import { useEffect, useRef, useState } from 'react'
import { Check, MapPin } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useDismiss } from '@/hooks/useDismiss'
import { fetchAddressSuggestions, isAddressLookupEnabled, type AddressSuggestion } from '@/lib/address'
import { cn } from '@/lib/cn'

/**
 * Address box with search suggestions (sink's AddressAutocomplete): suggestions after 3 characters,
 * a pick fills the form (the caller sets street, city, state and the pinned point). Without a
 * Geoapify key it's a plain address box, as sink with GEOAPIFY_KEY unset.
 */
export function KitAddressField({ label, value, onChange, onSelect, isPinned = false, error, placeholder = 'Start typing an address…', hint }: {
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: AddressSuggestion) => void
  isPinned?: boolean
  error?: string
  placeholder?: string
  hint?: string
}) {
  const enabled = isAddressLookupEnabled()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const term = useDebounce(value.trim(), 300)
  const active = enabled && typed && term.length >= 3
  useDismiss(rootRef, open, () => setOpen(false))

  useEffect(() => {
    if (!active) return
    let ignore = false
    fetchAddressSuggestions(term)
      .then(rows => { if (!ignore) { setSuggestions(rows); setOpen(true) } })
      .catch(() => { if (!ignore) setSuggestions([]) })
      .finally(() => { if (!ignore) setSearching(false) })
    return () => { ignore = true }
  }, [term, active])

  const pick = (suggestion: AddressSuggestion) => {
    setTyped(false)
    setOpen(false)
    setSuggestions([])
    onSelect(suggestion)
  }

  return <div ref={rootRef} className="relative min-w-0">
    <span className="mb-1.5 block text-[10px] font-extrabold text-foreground">{label}</span>
    <span className={cn('flex items-start gap-2 rounded-xl border border-border bg-[#F8FAF8] px-3 py-2.5 transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/10', error && 'border-[#C72D34]')}>
      {searching ? <span className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" aria-hidden="true"/> : <MapPin size={15} className="mt-0.5 shrink-0 text-muted-foreground"/>}
      <textarea rows={2} value={value} placeholder={placeholder} aria-label={label} aria-invalid={error ? true : undefined} aria-expanded={open} autoComplete="off"
        onChange={event => { const next = event.target.value; setTyped(true); if (enabled && next.trim().length >= 3) setSearching(true); onChange(next) }}
        onFocus={() => { if (suggestions.length) setOpen(true) }}
        className="min-w-0 flex-1 resize-none bg-transparent text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground"/>
      {isPinned && <span title="Location pinned" className="mt-0.5 shrink-0 text-[#1E854A]"><Check size={15} strokeWidth={2.6}/></span>}
    </span>
    {open && active && <div role="listbox" className="absolute inset-x-0 z-30 mt-1 flex max-h-56 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-[0_18px_44px_rgba(0,0,0,.14)]">
      {suggestions.length === 0 && <p className="px-3 py-3 text-[11px] font-semibold text-muted-foreground">{searching ? 'Searching…' : 'No matching addresses. Keep typing, or fill in the state and city below.'}</p>}
      {suggestions.map(suggestion => <button key={suggestion.id} type="button" role="option" aria-selected={false} onMouseDown={event => event.preventDefault()} onClick={() => pick(suggestion)} className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-muted">
        <MapPin size={14} className="mt-0.5 shrink-0 text-[#1E854A]"/>
        <span className="min-w-0"><span className="block truncate text-xs font-extrabold text-foreground">{suggestion.address || suggestion.label}</span><span className="block truncate text-[10px] text-muted-foreground">{[suggestion.city, suggestion.state].filter(Boolean).join(', ')}</span></span>
      </button>)}
    </div>}
    {error
      ? <span role="alert" className="mt-1 block text-[10px] font-bold text-[#C72D34]">{error}</span>
      : hint && enabled && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
  </div>
}
