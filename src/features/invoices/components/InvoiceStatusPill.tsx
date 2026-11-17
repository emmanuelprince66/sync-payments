import { Eye } from 'lucide-react'
import type { InvoicePaymentState } from '@/api/invoices'
import { cn } from '@/lib/cn'

const STATE_CLASS: Record<InvoicePaymentState, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Approved: 'bg-[#EEF3FB] text-[#3D5A99]',
  Pending: 'bg-[#FFF7DF] text-[#8F5F00]',
  'Part paid': 'bg-[#E8F2FF] text-[#1367D8]',
  Overdue: 'bg-[#FFF0F0] text-[#C72D34]',
  Paid: 'bg-[#E8F7EF] text-[#187A42]',
  Void: 'bg-muted text-muted-foreground line-through',
}

/** Paid / Part paid / Pending / Overdue (or Draft, Approved, Void), as worked out from payments and the due date. */
export function InvoiceStatusPill({ state, className }: { state: InvoicePaymentState; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', STATE_CLASS[state], className)}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"/>{state}
  </span>
}

/** The customer has opened the invoice's public link. */
export function ViewedTag({ className }: { className?: string }) {
  return <span title="The customer opened this invoice" className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#F1F4FA] px-2 py-1 text-[10px] font-extrabold text-[#4A5D86]', className)}><Eye size={11}/>Viewed</span>
}
