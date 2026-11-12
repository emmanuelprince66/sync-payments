import { CardSkeleton } from '@/components/ui/Skeleton'
import type { InvoiceSummary } from '@/api/invoices'
import { useFormatMoney } from '@/hooks/useFormatMoney'

/** Six months of invoiced vs collected, and where documents stand by status. */
export function InvoiceAnalytics({ summary, isLoading }: { summary?: InvoiceSummary; isLoading: boolean }) {
  const money = useFormatMoney()
  if (isLoading || !summary) return <CardSkeleton lines={5}/>
  const peak = Math.max(1, ...summary.months.flatMap(({ sent, paid }) => [sent, paid]))
  const height = (value: number) => `${value > 0 ? Math.max(4, Math.round((value / peak) * 100)) : 0}%`
  return <section className="grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-white xl:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)]">
    <div className="border-b border-border p-5 xl:border-b-0 xl:border-r">
      <div className="flex items-center justify-between">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-secondary">Invoice analytics</p><h2 className="mt-1 text-sm font-extrabold">Cash collection performance</h2></div>
        <span className="text-[9px] font-bold text-muted-foreground">Last 6 months</span>
      </div>
      {summary.months.length
        ? <div className="mt-6 flex h-36 items-end gap-3">
          {summary.months.map(({ month, sent, paid }, index) => <div key={`${month}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-28 items-end gap-1" title={`${month}: ${money(sent)} invoiced, ${money(paid)} collected`}>
              <div className="w-3 rounded-t-sm bg-primary/15" style={{ height: height(sent) }}/>
              <div className="w-3 rounded-t-sm bg-secondary" style={{ height: height(paid) }}/>
            </div>
            <span className="text-[8px] font-bold text-muted-foreground">{month}</span>
          </div>)}
        </div>
        : <p className="mt-6 grid h-36 place-items-center text-xs text-muted-foreground">No invoices sent in the last six months yet.</p>}
      <div className="mt-4 flex gap-4 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-primary/15"/> Invoiced</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-secondary"/> Collected</span>
      </div>
    </div>
    <div className="p-5">
      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Document flow</p>
      <div className="mt-5 flex flex-col gap-4">
        {summary.flow.map(item => <div key={item.label} className="flex items-center">
          <span className="mr-3 h-8 w-1 rounded-full" style={{ background: item.color }}/>
          <div className="min-w-0"><p className="text-[10px] font-extrabold">{item.label}</p><p className="mt-0.5 text-[8px] text-muted-foreground">{item.count} document{item.count === 1 ? '' : 's'}</p></div>
          {item.amount !== null && <p className="ml-auto pl-3 text-xs font-extrabold">{money(item.amount)}</p>}
        </div>)}
      </div>
      <div className="mt-5 rounded-lg bg-[#F4FAF5] p-3">
        <p className="text-[9px] font-extrabold text-secondary">{summary.collectionRate} collection rate</p>
        <p className="mt-1 text-[8px] leading-4 text-muted-foreground">Expected cash from outstanding invoices: {money(summary.expectedCash)}</p>
      </div>
    </div>
  </section>
}
