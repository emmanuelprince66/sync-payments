import { createColumnHelper } from '@tanstack/react-table'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useMemo } from 'react'
import type { CustomerTransaction } from '@/api/customers'
import { formatActivityDate } from '@/api/http'
import { DataTable } from '@/components/ui/DataTable'
import { KitEmpty, KitFilterPills, kitTableClass } from '@/components/ui/KitExtras'
import { Pagination } from '@/components/ui/Pagination'
import { StatusPill } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import type { CustomerDetailModel } from '../hooks/useCustomerDetailPage'

const column = createColumnHelper<CustomerTransaction>()
const head = 'py-3.5'

const STATUS_LABELS: Record<string, string> = { SUCCESSFUL: 'Completed', PAID: 'Completed', UNPAID: 'Pending', PENDING: 'Pending', REVERSED: 'Reversed', CANCELLED: 'Failed' }
const statusLabel = (status: string) => STATUS_LABELS[status.toUpperCase()] ?? (status ? status.charAt(0) + status.slice(1).toLowerCase() : '—')
const titleCase = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, char => char.toUpperCase())

function Title({ row }: { row: CustomerTransaction }) {
  const inflow = row.flow === 'INFLOW'
  return <div className="flex items-center gap-3">
    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', inflow ? 'bg-accent text-secondary' : 'bg-[#E7F1FC] text-[#1C6FA8]')}>{inflow ? <ArrowDownLeft size={15}/> : <ArrowUpRight size={15}/>}</span>
    <div className="min-w-0"><p className="truncate font-extrabold text-foreground">{row.title}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{titleCase(row.type)}{row.reference ? ` · ${row.reference}` : ''}</p></div>
  </div>
}

/** The customer's ledger: purchases, wallet movements, debt settlements, loyalty and referral events. */
export function CustomerTransactions({ model }: { model: CustomerDetailModel['transactions'] }) {
  const money = useFormatMoney()
  const columns = useMemo(() => [
    column.display({ id: 'title', header: 'Transaction', cell: ({ row }) => <Title row={row.original}/>, meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' } }),
    column.accessor('paymentMethod', { header: 'Method', cell: info => <span className="font-bold text-foreground/75">{info.getValue() ? titleCase(info.getValue()) : '—'}</span>, meta: { headerClassName: head } }),
    column.accessor('createdAt', { header: 'Date', cell: info => <span className="font-bold text-foreground/75">{formatActivityDate(info.getValue())}</span>, meta: { headerClassName: head } }),
    column.accessor('status', { header: 'Status', cell: info => <StatusPill value={statusLabel(info.getValue())}/>, meta: { headerClassName: head } }),
    column.display({ id: 'amount', header: 'Amount', cell: ({ row: { original } }) => <span className="font-extrabold">{original.flow === 'INFLOW' ? '+' : ''}{money(original.amount)}</span>, meta: { headerClassName: `${head} px-5 text-right`, cellClassName: 'px-5 text-right' } }),
  ], [money])

  return <section className="overflow-hidden rounded-xl border border-border bg-white">
    <div className="flex flex-col gap-3 border-b border-border p-4">
      <div><h2 className="text-sm font-extrabold">History</h2><p className="mt-1 text-[10px] text-muted-foreground">Purchases, wallet top-ups, debt payments and rewards.</p></div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <KitFilterPills value={model.type} options={model.types} onChange={model.setType}/>
      </div>
    </div>
    <div className={cn(kitTableClass, 'transition-opacity', model.isFetching && 'opacity-60')}>
      <DataTable
        columns={columns}
        data={model.rows}
        loading={model.isLoading}
        minWidthClassName="min-w-[720px]"
        getRowId={row => row.id}
        emptyState={model.isError ? 'We couldn’t load this history. Try again shortly.' : <KitEmpty title="No transactions yet" note="Purchases and wallet movements for this customer will show here." className="py-6"/>}
        renderMobileCard={row => <div className="p-4 text-xs">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><Title row={row}/></div><span className="shrink-0 font-extrabold">{row.flow === 'INFLOW' ? '+' : ''}{money(row.amount)}</span></div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] text-muted-foreground">{formatActivityDate(row.createdAt)}{row.paymentMethod ? ` · ${titleCase(row.paymentMethod)}` : ''}</p><StatusPill value={statusLabel(row.status)}/></div>
        </div>}
      />
    </div>
    {model.pages > 1 && <Pagination currentPage={model.page} totalPages={model.pages} onPageChange={model.setPage}/>}
  </section>
}
