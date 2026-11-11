import type { InvoicePaymentState } from '@/api/invoices'
import { cn } from '@/lib/cn'

const STATE_CLASS: Record<InvoicePaymentState, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Pending: 'bg-[#FFF6E4] text-[#A76700]',
  'Part paid': 'bg-[#E7F1FC] text-[#1C6FA8]',
  Overdue: 'bg-[#FDEAEA] text-[#C72D34]',
  Paid: 'bg-[#E8F5EA] text-[#337D44]',
}

/** Paid / Part paid / Pending / Overdue (or Draft), as worked out from payments and the due date. */
export function InvoiceStatusPill({ state, className }: { state: InvoicePaymentState; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', STATE_CLASS[state], className)}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"/>{state}
  </span>
}
