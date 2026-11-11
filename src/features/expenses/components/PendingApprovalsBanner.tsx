import { ChevronRight, ClipboardCheck } from 'lucide-react'
import { useExpensePermissions, usePendingTransfers } from '@/api/expenses'
import { useFormatMoney } from '@/hooks/useFormatMoney'

/**
 * Payouts waiting on a decision, said on the page (sink: PendingApprovalsBanner). Silent when nothing
 * waits; the wording changes for someone who raised a request but can't decide one.
 */
export function PendingApprovalsBanner({ onOpen }: { onOpen: () => void }) {
  const { canApprove, canTransfer } = useExpensePermissions()
  const pending = usePendingTransfers()
  const money = useFormatMoney()
  if (!(canApprove || canTransfer) || !pending.total) return null

  const note = canApprove
    ? pending.yours > 0
      ? `${pending.yours} on the first page ${pending.yours === 1 ? 'needs' : 'need'} yours. Worth ${money(pending.value)} in total.`
      : 'None of them are yours to release: they are waiting on someone else.'
    : 'Yours are in here too. An approver decides them.'

  return <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl border border-secondary/40 bg-accent p-4 text-left transition hover:bg-accent/70">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-white"><ClipboardCheck size={18}/></span>
    <span className="min-w-0 flex-1">
      <span className="block text-xs font-extrabold">{pending.total} payout{pending.total === 1 ? '' : 's'} waiting on a decision</span>
      <span className="mt-0.5 block text-[10px] text-muted-foreground">{note}</span>
    </span>
    <ChevronRight size={18} className="shrink-0 text-secondary"/>
  </button>
}
