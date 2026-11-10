import { Banknote, ArrowDownLeft, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton, KitStatCard } from '@/components/ui/PaymentKit'
import { StatCardsSkeleton } from '@/components/ui/Skeleton'
import { SampleDataBadge } from '@/components/ui/misc'
import { ExceptionsTable } from './components/ExceptionsTable'
import { useReconciliationPage } from './hooks/useReconciliationPage'

const statsGrid = 'grid grid-cols-1 gap-4 md:grid-cols-4'

export default function ReconciliationPage() {
  const page = useReconciliationPage()
  return <KitPage>
    <KitPageHeader
      title="Reconciliation"
      subtitle="Match terminal collections to your bank settlements."
      badge={<SampleDataBadge/>}
      actions={<KitButton loading={page.isRunning} onClick={page.run}>{!page.isRunning && <RefreshCw size={14}/>} Run reconciliation</KitButton>}
    />
    {page.data
      ? <div className={statsGrid}>
        <KitStatCard label="Settlement total" value={page.money(page.data.settlementTotal)} note={page.data.settlementDate} icon={Banknote}/>
        <KitStatCard label="Auto-matched" value={page.data.autoMatched.toLocaleString()} note={page.data.matchRate} icon={CheckCircle2}/>
        <KitStatCard label="Needs review" value={String(page.data.needsReview)} note={page.data.highPriority} icon={Clock3} tone="amber"/>
        <KitStatCard label="Total variance" value={page.money(page.data.totalVariance)} note={page.data.variancePercent} icon={ArrowDownLeft} tone="blue"/>
      </div>
      : <StatCardsSkeleton count={4} className={statsGrid}/>}
    <ExceptionsTable dateRange={page.dateRange} onDateRange={page.setDateRange} rows={page.data?.exceptions ?? []} isLoading={page.isLoading} resolvingId={page.resolvingId} onResolve={page.resolve}/>
  </KitPage>
}
