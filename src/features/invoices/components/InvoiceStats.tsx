import { ArrowDownLeft, CheckCircle2, Clock3, FileText } from 'lucide-react'
import { KitStatCard } from '@/components/ui/PaymentKit'
import { StatCardsSkeleton } from '@/components/ui/Skeleton'
import type { InvoiceSummary } from '@/api/invoices'
import { useFormatMoney } from '@/hooks/useFormatMoney'

type Stats = { outstanding: number; outstandingCount: number; overdue: number; overdueCount: number; summary?: InvoiceSummary }

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export function InvoiceStats({ stats, isLoading }: { stats: Stats; isLoading: boolean }) {
  const money = useFormatMoney()
  const gridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'
  if (isLoading || !stats.summary) return <StatCardsSkeleton count={4} className={gridClass}/>
  return <div className={gridClass}>
    <KitStatCard label="Outstanding" value={money(stats.outstanding)} note={`Across ${plural(stats.outstandingCount, 'invoice')}`} icon={FileText} tone="amber"/>
    <KitStatCard label="Paid this month" value={money(stats.summary.paidThisMonth)} note={stats.summary.paidChange} icon={CheckCircle2}/>
    <KitStatCard label="Overdue" value={money(stats.overdue)} note={`${plural(stats.overdueCount, 'invoice')} ${stats.overdueCount === 1 ? 'needs' : 'need'} follow-up`} icon={Clock3} tone="amber"/>
    <KitStatCard label="Average paid in" value={stats.summary.averagePaidDays} note={stats.summary.averagePaidChange} icon={ArrowDownLeft} tone="blue"/>
  </div>
}
