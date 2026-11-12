import { ArrowDownLeft, CheckCircle2, Clock3, FileText } from 'lucide-react'
import { KitStatCard } from '@/components/ui/PaymentKit'
import { StatCardsSkeleton } from '@/components/ui/Skeleton'
import type { InvoiceSummary } from '@/api/invoices'
import { useFormatMoney } from '@/hooks/useFormatMoney'

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** Outstanding, paid this month, overdue and average days to pay, from the analytics endpoint. */
export function InvoiceStats({ summary, isLoading }: { summary?: InvoiceSummary; isLoading: boolean }) {
  const money = useFormatMoney()
  const gridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'
  if (isLoading || !summary) return <StatCardsSkeleton count={4} className={gridClass}/>
  return <div className={gridClass}>
    <KitStatCard label="Outstanding" value={money(summary.outstanding)} note={`Across ${plural(summary.outstandingCount, 'invoice')}`} icon={FileText} tone="amber"/>
    <KitStatCard label="Paid this month" value={money(summary.paidThisMonth)} note={summary.paidChange || 'Collected so far this month'} icon={CheckCircle2}/>
    <KitStatCard label="Overdue" value={money(summary.overdue)} note={summary.overdueCount ? `${plural(summary.overdueCount, 'invoice')} ${summary.overdueCount === 1 ? 'needs' : 'need'} follow-up` : 'Nothing overdue'} icon={Clock3} tone="amber"/>
    <KitStatCard label="Average paid in" value={summary.averagePaidDays} note="From sending to paid in full" icon={ArrowDownLeft} tone="blue"/>
  </div>
}
