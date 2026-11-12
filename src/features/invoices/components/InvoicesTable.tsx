import { createColumnHelper } from '@tanstack/react-table'
import { ChevronRight, Search } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { invoiceBalance, invoicePaymentState, type Invoice } from '@/api/invoices'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { shortDate } from '../dates'
import { InvoiceStatusPill, ViewedTag } from './InvoiceStatusPill'

function ViewButton({ invoice, onClick }: { invoice: Invoice; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={`View more about ${invoice.number}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-extrabold text-secondary hover:bg-accent">View more <ChevronRight size={12}/></button>
}

/** Payment state, plus "Viewed" while the customer has opened it but not yet paid. */
function StatusCell({ invoice }: { invoice: Invoice }) {
  const state = invoicePaymentState(invoice)
  return <span className="inline-flex flex-wrap items-center gap-1.5"><InvoiceStatusPill state={state}/>{invoice.viewed && state !== 'Paid' && <ViewedTag/>}</span>
}

const head = 'bg-[#FAFBFA] py-3'
const column = createColumnHelper<Invoice>()

type Props = {
  rows: Invoice[]
  isLoading: boolean
  search: string
  onSearch: (value: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onView: (invoice: Invoice) => void
  actions: ReactNode
}

export function InvoicesTable({ rows, isLoading, search, onSearch, currentPage, totalPages, onPageChange, onView, actions }: Props) {
  const money = useFormatMoney()
  const columns = useMemo(() => [
    column.accessor('number', { header: 'Invoice', meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5 font-mono text-[10px] font-bold' } }),
    column.accessor('client', { header: 'Client', meta: { headerClassName: head, cellClassName: 'font-extrabold' } }),
    column.accessor('issued', { header: 'Issued', cell: info => shortDate(info.getValue()), meta: { headerClassName: head, cellClassName: 'text-muted-foreground' } }),
    column.accessor('due', { header: 'Due', cell: info => shortDate(info.getValue()), meta: { headerClassName: head, cellClassName: 'text-muted-foreground' } }),
    column.display({ id: 'status', header: 'Status', cell: info => <StatusCell invoice={info.row.original}/>, meta: { headerClassName: head } }),
    column.accessor('amount', { header: 'Amount', cell: info => money(info.getValue()), meta: { headerClassName: `${head} text-right`, cellClassName: 'text-right font-extrabold' } }),
    column.display({ id: 'balance', header: 'Balance', cell: info => money(invoiceBalance(info.row.original)), meta: { headerClassName: `${head} text-right`, cellClassName: 'text-right text-muted-foreground' } }),
    column.display({ id: 'action', header: 'Action', cell: info => <ViewButton invoice={info.row.original} onClick={() => onView(info.row.original)}/>, meta: { headerClassName: `${head} px-5 text-right`, cellClassName: 'px-5 text-right' } }),
  ], [money, onView])

  return <section className="overflow-hidden rounded-2xl border border-border bg-white">
    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
      <label className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <input aria-label="Search invoices or clients" placeholder="Search invoices or clients" value={search} onChange={event => onSearch(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-[#F8FAF8] pl-9 pr-3 text-xs font-semibold outline-none focus:border-secondary"/>
      </label>
      <div className="flex gap-2">{actions}</div>
    </div>
    <div className="text-xs">
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        minWidthClassName="min-w-[880px]"
        getRowId={row => row.id}
        emptyState="No invoices match your search or dates."
        renderMobileCard={invoice => <div className="p-4 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="truncate font-extrabold">{invoice.client}</p><p className="mt-1 font-mono text-[10px] font-bold text-muted-foreground">{invoice.number}</p></div>
            <p className="shrink-0 font-extrabold">{money(invoice.amount)}</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">{shortDate(invoice.issued)} · Due {shortDate(invoice.due)}</p>
            <StatusCell invoice={invoice}/>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold text-muted-foreground">Balance {money(invoiceBalance(invoice))}</p>
            <ViewButton invoice={invoice} onClick={() => onView(invoice)}/>
          </div>
        </div>}
      />
    </div>
    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange}/>}
  </section>
}
