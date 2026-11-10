import { createColumnHelper } from '@tanstack/react-table'
import { Check } from 'lucide-react'
import { useMemo } from 'react'
import type { ReconciliationException } from '@/api/reconciliation'
import { DataTable } from '@/components/ui/DataTable'
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter'
import { StatusPill } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'

const head = 'bg-[#FAFBFA] py-3'
const column = createColumnHelper<ReconciliationException>()

type Props = { dateRange: DateRange | undefined; onDateRange: (value: DateRange | undefined) => void; rows: ReconciliationException[]; isLoading: boolean; resolvingId: string | null | undefined; onResolve: (id: string) => void }

function ResolveAction({ row, resolvingId, onResolve }: { row: ReconciliationException } & Pick<Props, 'resolvingId' | 'onResolve'>) {
  if (row.resolved) return <span className="inline-flex items-center gap-1 font-extrabold text-secondary"><Check size={14}/> Resolved</span>
  return <button type="button" disabled={resolvingId === row.id} onClick={() => onResolve(row.id)} className="rounded-lg border border-secondary px-3 py-1.5 font-extrabold text-secondary hover:bg-accent disabled:opacity-50">Resolve</button>
}

type Money = (amount: number) => string

const receivedText = (row: ReconciliationException, money: Money) => (row.received === null ? 'Pending' : money(row.received))

const varianceOf = (row: ReconciliationException, money: Money) => {
  if (row.received === null) return { text: '—', className: 'text-secondary' }
  const variance = row.received - row.expected
  return variance < 0 ? { text: `−${money(Math.abs(variance))}`, className: 'text-[#C72D34]' } : { text: money(variance), className: 'text-secondary' }
}

function Variance({ row, money, className }: { row: ReconciliationException; money: Money; className?: string }) {
  const { text, className: tone } = varianceOf(row, money)
  return <span className={cn('font-extrabold', tone, className)}>{text}</span>
}

export function ExceptionsTable({ dateRange, onDateRange, rows, isLoading, resolvingId, onResolve }: Props) {
  const money = useFormatMoney()

  const columns = useMemo(() => [
    column.display({ id: 'item', header: 'Item', cell: ({ row }) => <><p className="font-extrabold">{row.original.source}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{row.original.id}</p></>, meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' } }),
    column.accessor('expected', { header: 'Expected', cell: info => money(info.getValue()), meta: { headerClassName: head, cellClassName: 'font-bold' } }),
    column.display({ id: 'received', header: 'Received', cell: ({ row }) => receivedText(row.original, money), meta: { headerClassName: head, cellClassName: 'font-bold' } }),
    column.display({ id: 'variance', header: 'Variance', cell: ({ row }) => <Variance row={row.original} money={money}/>, meta: { headerClassName: head } }),
    column.accessor('date', { header: 'Time', meta: { headerClassName: head, cellClassName: 'text-muted-foreground' } }),
    column.display({ id: 'action', header: 'Action', cell: ({ row }) => <ResolveAction row={row.original} resolvingId={resolvingId} onResolve={onResolve}/>, meta: { headerClassName: `${head} px-5 text-right`, cellClassName: 'px-5 text-right' } }),
  ], [money, resolvingId, onResolve])

  return <section className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><h2 className="text-sm font-extrabold">Exceptions to review</h2><p className="mt-1 text-[11px] text-muted-foreground">Resolve discrepancies before the settlement closes at 4:00 PM.</p></div>
      <div className="flex min-w-0 items-center gap-2">
        <DateRangeFilter value={dateRange} onChange={onDateRange} placeholder="All dates" className="min-w-0 flex-1 sm:flex-none"/>
        <span className="shrink-0"><StatusPill value="Review"/></span>
      </div>
    </div>
    <div className="text-xs">
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        minWidthClassName="min-w-[760px]"
        getRowId={row => row.id}
        emptyState="No exceptions in this period."
        renderMobileCard={row => <div className="p-4 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="font-extrabold">{row.source}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{row.id}</p></div>
            <p className="shrink-0 text-right text-[10px] text-muted-foreground">{row.date}</p>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
            <div className="min-w-0"><dt className="text-muted-foreground">Expected</dt><dd className="mt-0.5 break-words font-bold">{money(row.expected)}</dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">Received</dt><dd className="mt-0.5 break-words font-bold">{receivedText(row, money)}</dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">Variance</dt><dd className="mt-0.5 break-words"><Variance row={row} money={money}/></dd></div>
          </dl>
          <div className="mt-3"><ResolveAction row={row} resolvingId={resolvingId} onResolve={onResolve}/></div>
        </div>}
      />
    </div>
  </section>
}
