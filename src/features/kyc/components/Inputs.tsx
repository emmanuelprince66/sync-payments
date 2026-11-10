import type { IdentityMethod } from '@/api/kyc'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { IDENTITY_LABELS } from '../hooks/useKyc'
import { readableSize, useFileUpload } from '../hooks/useFileUpload'

const IDENTITY_OPTIONS: { value: IdentityMethod; hint: string; icon: IconName }[] = [
  { value: 'nin', hint: 'The 11-digit number on your NIMC slip. Dial *346# to retrieve it.', icon: 'user' },
  { value: 'bvn', hint: 'The 11-digit number your bank holds. Dial *565*0# to retrieve it.', icon: 'card' },
]

/** Which identifier Tier 1 is opened with: radio cards, since each needs a line of explanation. */
export function IdentityMethodPicker({ value, onChange }: { value: IdentityMethod; onChange: (method: IdentityMethod) => void }) {
  return <div role="radiogroup" aria-label="Identity type" className="grid gap-3 sm:grid-cols-2">
    {IDENTITY_OPTIONS.map(option => {
      const active = value === option.value
      return <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(option.value)} className={cn('flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition', active ? 'border-secondary bg-[#F4FAF5]' : 'border-border bg-white hover:border-secondary/30')}>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground')}><Icon name={option.icon} size={17}/></span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold text-foreground">{IDENTITY_LABELS[option.value]}</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{option.hint}</span>
        </span>
        <span className={cn('mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-secondary' : 'border-secondary/30')}>{active && <span className="h-1.5 w-1.5 rounded-full bg-secondary"/>}</span>
      </button>
    })}
  </div>
}

type FileUploadFieldProps = {
  id: string
  label: string
  hint?: string
  accept?: string
  value: File | null
  onChange: (file: File | null) => void
  error?: string
  compact?: boolean
}

/** One document slot: drop zone until a file is chosen, then a summary row with remove. */
export function FileUploadField({ id, label, hint, accept = '.pdf,.jpg,.jpeg,.png', value, onChange, error, compact = false }: FileUploadFieldProps) {
  const { inputRef, dragging, message, pick, onInput, dropHandlers, remove } = useFileUpload(onChange, error)
  return <div className="w-full">
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={id} className="text-[10px] font-extrabold text-foreground">{label}<span className="text-[#C72D34]"> *</span></label>
      {value && <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-secondary"><Icon name="check" size={12} stroke={2.6}/>Added</span>}
    </div>
    {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    {value
      ? <div className={cn('mt-2 flex items-center gap-3 rounded-xl border border-secondary/25 bg-[#F4FAF5]', compact ? 'px-3 py-2.5' : 'px-4 py-3')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-secondary"><Icon name="copy" size={16}/></span>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-foreground">{value.name}</p><p className="text-[10px] text-muted-foreground">{readableSize(value.size)}</p></div>
        <button type="button" aria-label={`Remove ${label}`} onClick={remove} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white hover:text-[#C72D34]"><Icon name="close" size={16}/></button>
      </div>
      : <div
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick() } }}
        {...dropHandlers}
        className={cn('mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-white transition-colors', compact ? 'px-3 py-3' : 'px-4 py-4',
          dragging ? 'border-secondary bg-[#F4FAF5]' : message ? 'border-[#C72D34]' : 'border-secondary/30 hover:border-secondary hover:bg-accent')}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon name="download" size={16}/></span>
        <div className="min-w-0"><p className="text-xs font-extrabold text-secondary">Choose a file</p><p className="text-[10px] text-muted-foreground">or drop it here · PDF, JPG or PNG up to 5 MB</p></div>
      </div>}
    <input ref={inputRef} id={id} type="file" accept={accept} className="hidden" onChange={event => onInput(event.target.files)}/>
    {message && <p role="alert" className="mt-1.5 text-[11px] font-semibold text-[#C72D34]">{message}</p>}
  </div>
}
