import { ArrowLeftRight, Check, Package, ReceiptText } from 'lucide-react'
import { cn } from '@/lib/cn'

/** What Add expense starts with: log it by hand, or move money out of the expense wallet. */
export type ExpenseKind = 'EXPENSE' | 'PURCHASE' | 'WALLET_TRANSFER'

const KINDS = [
  { value: 'EXPENSE', title: 'Log Expense', hint: 'Spent to run the business: fuel, rent, utilities, salaries.', tag: 'Manual', icon: ReceiptText, tone: 'bg-[#FFF0F0] text-[#C72D34]' },
  { value: 'PURCHASE', title: 'Log Purchase', hint: 'Spent to buy goods to sell, or raw materials.', tag: 'Manual', icon: Package, tone: 'bg-[#E8F2FF] text-[#1367D8]' },
  { value: 'WALLET_TRANSFER', title: 'Wallet Transfer', hint: 'Moved from your expense wallet to a bank account.', tag: 'Moves money', icon: ArrowLeftRight, tone: 'bg-accent text-brand' },
] as const

/**
 * The first step of Add expense (Mr Sunde, 27 Nov): a manual entry records spend without moving money; a wallet
 * transfer pays it out of the expense wallet, with PIN and approval.
 */
export function ExpenseKindChooser({ onPick, transferBlockedReason }: { onPick: (kind: ExpenseKind) => void; transferBlockedReason?: string }) {
  return <div className="flex flex-col gap-3 p-6">
    <p className="text-xs text-muted-foreground">What would you like to record?</p>
    {KINDS.map(kind => {
      const Icon = kind.icon
      const blocked = kind.value === 'WALLET_TRANSFER' && Boolean(transferBlockedReason)
      return <button key={kind.value} type="button" disabled={blocked} onClick={() => onPick(kind.value)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left transition-colors hover:border-secondary hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-white">
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', kind.tone)}><Icon size={19}/></span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-extrabold">{kind.title}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground">{kind.tag}</span></span>
          <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{blocked ? transferBlockedReason : kind.hint}</span>
        </span>
      </button>
    })}
  </div>
}

/** "What is this transfer for?" — asked before the transfer form (Expense or Purchase). */
export function TransferPurposeRadio({ value, onChange }: { value: 'EXPENSE' | 'PURCHASE' | null; onChange: (value: 'EXPENSE' | 'PURCHASE') => void }) {
  const options = [
    { value: 'EXPENSE', title: 'Expense', hint: 'Money you spent to run your business.' },
    { value: 'PURCHASE', title: 'Purchase', hint: 'Money you spent to buy goods to sell.' },
  ] as const
  return <fieldset className="flex flex-col gap-3">
    <legend className="mb-3 text-sm font-extrabold">What is this transfer for?</legend>
    {options.map(option => {
      const active = value === option.value
      return <label key={option.value} className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors', active ? 'border-secondary bg-accent' : 'border-border bg-white hover:border-secondary/50')}>
        <input type="radio" name="transfer-purpose" value={option.value} checked={active} onChange={() => onChange(option.value)} className="sr-only"/>
        <span aria-hidden="true" className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2', active ? 'border-secondary bg-secondary text-white' : 'border-[#C9CCCF] bg-white')}>{active && <Check size={11} strokeWidth={3}/>}</span>
        <span><span className="block text-sm font-extrabold">{option.title}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{option.hint}</span></span>
      </label>
    })}
  </fieldset>
}
