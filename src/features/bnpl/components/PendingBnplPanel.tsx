import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import type { PendingBnplOrder } from '@/api/bnpl'
import { DataTable } from '@/components/ui/DataTable'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { KitEmpty, KitFilterPills, kitTableClass } from '@/components/ui/KitExtras'
import { Pagination } from '@/components/ui/Pagination'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { usePendingBnplPanel } from '../hooks/usePendingBnplPanel'
import { BnplStageBadge } from './BnplStageBadge'

const column = createColumnHelper<PendingBnplOrder>()
const head = 'py-3.5'

const asDate = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
const formatDay = (value: string | null) => asDate(value)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) ?? '—'
const formatTime = (value: string | null) => asDate(value)?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) ?? ''

/**
 * Akawopay settlements on their way to the wallet (sink's PendingBnplPanel). Gross, fee and
 * net each get a column: the point is the gap between what the customer paid and what lands.
 */
export function PendingBnplPanel() {
  const panel = usePendingBnplPanel()
  const money = useFormatMoney()

  const columns = useMemo(() => [
    column.accessor('orderReference', { header: 'Order', cell: info => <span className="font-extrabold text-secondary">{info.getValue()}</span>, meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' } }),
    // A walk-in was never tied to a customer record: say so rather than a dash.
    column.accessor('customer', { header: 'Customer', cell: info => <div><p className="font-bold">{info.getValue()?.name ?? 'Walk-in customer'}</p>{info.getValue()?.phone && <p className="mt-0.5 text-[10px] text-muted-foreground">{info.getValue()?.phone}</p>}</div>, meta: { headerClassName: head } }),
    // Once paid out, when it landed is the more useful of the two dates.
    column.accessor('orderDate', { header: 'Date', cell: ({ row: { original } }) => <div><p className="font-bold text-foreground/75">{formatDay(original.orderDate)}</p>{original.settledAt ? <p className="mt-0.5 text-[10px] font-bold text-[#337D44]">Paid {formatDay(original.settledAt)}</p> : <p className="mt-0.5 text-[10px] text-muted-foreground">{formatTime(original.orderDate)}</p>}</div>, meta: { headerClassName: head } }),
    column.accessor('stage', { header: 'Stage', cell: ({ row: { original } }) => <BnplStageBadge stage={original.stage} label={original.stageLabel} description={original.stageDescription}/>, meta: { headerClassName: head } }),
    column.accessor('orderAmount', { header: 'Order amount', cell: info => <span className="text-foreground/75">{money(info.getValue())}</span>, meta: { headerClassName: head } }),
    column.accessor('feeDeducted', { header: 'Fee', cell: ({ row: { original } }) => <div><p className="font-bold text-[#C72D34]">−{money(original.feeDeducted)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{original.feeRate}</p></div>, meta: { headerClassName: head } }),
    column.accessor('netSettlementAmount', { header: 'You receive', cell: info => <span className="font-extrabold">{money(info.getValue())}</span>, meta: { headerClassName: `${head} px-5 text-right`, cellClassName: 'px-5 text-right' } }),
  ], [money])

  return <section className="overflow-hidden rounded-xl border border-border bg-white">
    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><h2 className="text-sm font-extrabold">Settlements</h2><p className="mt-1 text-[10px] text-muted-foreground">Akawopay payouts on their way to your wallet. None of this is in your balance yet.</p></div>
      <DateRangeFilter value={panel.dateRange} onChange={panel.setDateRange} placeholder="All dates" className="w-full sm:w-auto"/>
    </div>

    <div className="grid grid-cols-2 border-b border-border lg:grid-cols-4">
      {panel.tiles.map(tile => <div key={tile.label} className="min-w-0 border-border p-4 odd:border-r lg:border-r lg:last:border-r-0">
        <p className="text-[9px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">{tile.label}</p>
        {panel.isLoading ? <Skeleton className="mt-2 h-6 w-20"/> : <p className={cn('mt-2 text-lg font-extrabold [overflow-wrap:anywhere]', tile.tone === 'positive' && 'text-[#337D44]', tile.tone === 'negative' && 'text-[#C72D34]')}>{tile.value}</p>}
        <p className="mt-1 text-[10px] text-muted-foreground">{tile.hint}</p>
      </div>)}
    </div>

    <div className="flex gap-2 overflow-x-auto border-b border-border p-4">
      <KitFilterPills value={panel.stage} options={panel.tabs} onChange={panel.setStage}/>
    </div>

    {panel.isError
      ? <KitEmpty title="Could not load BNPL settlements" note="Try again in a moment. Anything already settled still shows under Transactions." action={<KitButton variant="secondary" onClick={panel.retry}>Try again</KitButton>}/>
      : <div className={cn(kitTableClass, 'transition-opacity', panel.isFetching && 'opacity-60')}>
        <DataTable
          columns={columns}
          data={panel.orders}
          loading={panel.isLoading}
          minWidthClassName="min-w-[820px]"
          emptyState="Nothing waiting to be settled"
          getRowId={order => order.saleId || order.orderReference}
          renderMobileCard={order => <div className="p-4 text-xs">
            <div className="flex items-center justify-between gap-3"><span className="font-extrabold text-secondary">{order.orderReference}</span><span className="font-extrabold">{money(order.netSettlementAmount)}</span></div>
            <p className="mt-1 truncate text-[11px] font-bold">{order.customer?.name ?? 'Walk-in customer'} <span className="font-medium text-muted-foreground">· {formatDay(order.orderDate)}</span></p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><BnplStageBadge stage={order.stage} label={order.stageLabel} description={order.stageDescription}/><span className="text-[10px] text-muted-foreground">{money(order.orderAmount)} − <span className="text-[#C72D34]">{money(order.feeDeducted)}</span></span></div>
          </div>}
        />
      </div>}

    {panel.pages > 1 && <Pagination currentPage={panel.page} totalPages={panel.pages} onPageChange={panel.setPage}/>}
  </section>
}
