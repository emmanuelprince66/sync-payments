import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import type { Branch, WalletRow } from '@/api/branches'
import { formatActivityDate } from '@/api/http'
import { DataTable } from '@/components/ui/DataTable'
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter'
import { Pagination } from '@/components/ui/Pagination'
import { StatusPill } from '@/components/ui/PaymentKit'
import { Select } from '@/components/ui/Select'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

const ALL = 'all'
const head = 'bg-[#FAFBFA] py-3.5'
const column = createColumnHelper<WalletRow>()

type Props = {
  branches: Branch[]
  branchNames: Record<string, string>
  dateRange: DateRange | undefined
  onDateRange: (value: DateRange | undefined) => void
  activeId: string | null
  onChangeBranch: (id: string | null) => void
  rows: WalletRow[]
  isLoading: boolean
  isError: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onView: (row: WalletRow) => void
}

function Sender({ row }: { row: WalletRow }) {
  return <div className="flex items-center gap-3">
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[9px] font-extrabold text-secondary">{initials(row.counterparty)}</div>
    <div className="min-w-0"><p className="truncate font-extrabold text-foreground">{row.counterparty}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{row.reference}</p></div>
  </div>
}

function Amount({ row }: { row: WalletRow }) {
  const money = useFormatMoney()
  const isDebit = row.type === 'DEBIT'
  return <span className={cn('font-extrabold', isDebit ? 'text-[#C72D34]' : 'text-foreground')}>{isDebit ? '−' : '+'}{money(row.amount)}</span>
}

function ViewMore({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-md border border-border px-2.5 py-1.5 text-[9px] font-extrabold text-secondary hover:border-secondary hover:bg-accent">View more</button>
}

export function BranchTransactions({ branches, branchNames, dateRange, onDateRange, activeId, onChangeBranch, rows, isLoading, isError, currentPage, totalPages, onPageChange, onView }: Props) {
  const columns = useMemo(() => [
    column.display({ id: 'sender', header: 'Sender / customer', cell: ({ row }) => <Sender row={row.original}/>, meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' } }),
    column.display({ id: 'branch', header: 'Branch', cell: ({ row }) => <p className="font-extrabold text-foreground/80">{branchNames[row.original.bankId]}</p>, meta: { headerClassName: head } }),
    column.display({ id: 'source', header: 'Payment source', cell: ({ row }) => <><p className="font-bold text-foreground/75">{row.original.channel}</p><p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{row.original.reference}</p></>, meta: { headerClassName: head } }),
    column.accessor('createdAt', { header: 'Date', cell: info => <p className="font-bold text-foreground/75">{formatActivityDate(info.getValue())}</p>, meta: { headerClassName: head } }),
    column.accessor('status', { header: 'Status', cell: info => <StatusPill value={info.getValue()}/>, meta: { headerClassName: head } }),
    column.display({ id: 'amount', header: 'Amount', cell: ({ row }) => <Amount row={row.original}/>, meta: { headerClassName: `${head} text-right`, cellClassName: 'text-right' } }),
    column.display({ id: 'details', header: 'Details', cell: ({ row }) => <ViewMore onClick={() => onView(row.original)}/>, meta: { headerClassName: `${head} px-5 text-right`, cellClassName: 'px-5 text-right' } }),
  ], [branchNames, onView])

  return <section className="overflow-hidden rounded-xl border border-border bg-white">
    {/* Heading far left, branch select far right on every width; on phones the date range takes its own row. */}
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4 sm:flex-nowrap sm:items-center">
      <div className="min-w-0 flex-1"><h2 className="text-sm font-extrabold">Branch transactions</h2><p className="mt-1 text-[10px] text-muted-foreground">Every sender, source channel, terminal, and branch in one ledger.</p></div>
      <DateRangeFilter value={dateRange} onChange={onDateRange} placeholder="All dates" className="order-last w-full sm:order-none sm:w-auto"/>
      <Select aria-label="Filter by branch" options={[{ value: ALL, label: 'All branches' }, ...branches.map(branch => ({ value: branch.id, label: branch.name }))]} value={activeId ?? ALL} onValueChange={next => onChangeBranch(next === ALL ? null : next)} className="w-[140px] shrink-0 sm:w-[170px]" boxClassName="h-10 border-border px-3 text-xs font-bold text-foreground"/>
    </div>
    <div className="text-xs">
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        minWidthClassName="min-w-[980px]"
        getRowId={row => `${row.bankId}-${row.id}`}
        emptyState={isError ? 'We could not load these transactions. Try again shortly.' : 'No transactions yet.'}
        renderMobileCard={row => <button type="button" onClick={() => onView(row)} className="block w-full p-4 text-left text-xs">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><Sender row={row}/></div><span className="shrink-0"><Amount row={row}/></span></div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-[10px] text-muted-foreground">{branchNames[row.bankId]} · {row.channel} · {formatActivityDate(row.createdAt)}</p>
            <StatusPill value={row.status}/>
          </div>
        </button>}
      />
    </div>
    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange}/>}
  </section>
}
