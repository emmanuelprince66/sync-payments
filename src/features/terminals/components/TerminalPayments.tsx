import { createColumnHelper } from '@tanstack/react-table'
import { CreditCard } from 'lucide-react'
import { useMemo } from 'react'
import { isTerminalSuccess, type TerminalPayment } from '@/api/terminals'
import { DataTable } from '@/components/ui/DataTable'
import { KitEmpty, KitFilterPills, KitSearch, kitTableClass } from '@/components/ui/KitExtras'
import { Pagination } from '@/components/ui/Pagination'
import { StatusPill } from '@/components/ui/PaymentKit'
import { trxDay, trxTime } from '@/features/transactions/format'
import { TERMINAL_STATUS_FILTERS, type TerminalsModel } from '../hooks/useTerminalsPage'

const column = createColumnHelper<TerminalPayment>()
const statusLabel = (status: string) => (isTerminalSuccess(status) ? 'Completed' : status === 'PENDING' ? 'Pending' : status === 'FAILED' ? 'Failed' : status || 'Pending')

/** Payments taken on this business's terminals, with server-side pagination. */
export function TerminalPayments({ payments }: { payments: TerminalsModel['payments'] }) {
  const { money } = payments
  const columns = useMemo(() => [
    column.display({ id: 'terminal', header: 'Terminal', meta: { headerClassName: 'px-5', cellClassName: 'px-5' }, cell: ({ row: { original } }) => <><p className="font-extrabold text-foreground">{original.terminal || '—'}</p><p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{original.rrn || original.id}</p></> }),
    column.display({ id: 'type', header: 'Type', cell: ({ row: { original } }) => <p className="font-bold capitalize text-foreground/75">{original.type.toLowerCase() || 'Payment'}</p> }),
    column.display({ id: 'date', header: 'Date', cell: ({ row: { original } }) => <><p className="font-bold text-foreground/75">{trxDay(original.createdAt)}</p><p className="text-[10px] text-muted-foreground">{trxTime(original.createdAt)}</p></> }),
    column.display({ id: 'status', header: 'Status', cell: ({ row: { original } }) => <StatusPill value={statusLabel(original.status)}/> }),
    column.display({ id: 'amount', header: 'Amount', meta: { headerClassName: 'px-5 text-right', cellClassName: 'px-5 text-right' }, cell: ({ row: { original } }) => <span className="font-extrabold">{money(original.amount)}</span> }),
  ], [money])

  return <section className="overflow-hidden rounded-2xl border border-border bg-white">
    <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
      <div className="min-w-0 md:mr-auto"><h2 className="text-sm font-extrabold">Terminal payments{payments.terminal ? ` · ${payments.terminal}` : ''}</h2><p className="mt-1 text-[10px] text-muted-foreground">Every payment taken on your devices</p></div>
      <KitSearch value={payments.searchInput} onChange={payments.setSearch} placeholder="Search payments"/>
      <div className="no-scrollbar flex gap-2 overflow-x-auto"><KitFilterPills value={payments.status} options={TERMINAL_STATUS_FILTERS} onChange={payments.setStatus}/></div>
    </div>
    <DataTable
      columns={columns}
      data={payments.rows}
      loading={payments.loading}
      minWidthClassName="min-w-[640px]"
      className={kitTableClass}
      getRowId={row => row.id}
      emptyState={<KitEmpty icon={<CreditCard size={18}/>} title="No terminal payments" note="Payments appear here as your terminals take them." className="py-4"/>}
      mobileListClassName="divide-y divide-border/70"
      renderMobileCard={row => <div className="flex items-center gap-3 p-4 text-xs">
        <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{row.terminal || '—'}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{trxDay(row.createdAt)}, {trxTime(row.createdAt)}</span></span>
        <span className="shrink-0 text-right"><span className="block font-extrabold">{money(row.amount)}</span><span className="mt-1 block"><StatusPill value={statusLabel(row.status)}/></span></span>
      </div>}
    />
    {payments.pages > 1 && <Pagination currentPage={payments.page} totalPages={payments.pages} onPageChange={payments.setPage} className="border-border"/>}
  </section>
}
