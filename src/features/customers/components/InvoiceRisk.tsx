import { TriangleAlert } from 'lucide-react'
import type { InvoicePaymentState } from '@/api/invoices'
import { cn } from '@/lib/cn'

/** "At risk": the customer has a pending, part-paid or overdue invoice. */
export function AtRiskChip({ className }: { className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FDEAEA] px-2.5 py-1 text-[10px] font-extrabold text-[#C72D34]', className)}><TriangleAlert size={11}/>At risk</span>
}

/** Unpaid amount in red with the At risk chip, or a quiet dash when nothing is owed. */
export function UnpaidCell({ amount, atRisk }: { amount: string; atRisk: boolean }) {
  if (!atRisk) return <span className="text-[10px] font-bold text-muted-foreground">Nothing owed</span>
  return <span className="flex flex-wrap items-center gap-2"><span className="font-extrabold text-[#C72D34]">{amount}</span><AtRiskChip/></span>
}

const stateTones: Record<InvoicePaymentState, string> = {
  Paid: 'bg-[#E8F5EA] text-[#337D44]',
  Pending: 'bg-[#FFF6E4] text-[#A76700]',
  'Part paid': 'bg-[#E7F1FC] text-[#1C6FA8]',
  Overdue: 'bg-[#FDEAEA] text-[#C72D34]',
  Draft: 'bg-muted text-muted-foreground',
}

export function InvoiceStatePill({ value }: { value: InvoicePaymentState }) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', stateTones[value])}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{value}</span>
}
