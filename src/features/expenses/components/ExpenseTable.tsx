import { createColumnHelper } from '@tanstack/react-table'
import { CreditCard, SlidersHorizontal } from 'lucide-react'
import { useMemo } from 'react'
import { entryTypeLabel, type EntryFilter, type Expense } from '@/api/expenses'
import { DataTable } from '@/components/ui/DataTable'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { KitEmpty, KitModal, KitSearch, kitTableClass } from '@/components/ui/KitExtras'
import { KitSelect } from '@/components/ui/KitForm'
import { Pagination } from '@/components/ui/Pagination'
import { KitButton } from '@/components/ui/PaymentKit'
import { cn } from '@/lib/cn'
import { EXPENSE_STATUS_OPTIONS, expenseStatusClass, expenseStatusLabel } from '../format'
import type { ExpensesModel } from '../hooks/useExpensesPage'

const column = createColumnHelper<Expense>()

const TYPE_FILTERS: readonly { value: EntryFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EXPENSE', label: 'Expenses' },
  { value: 'PURCHASE', label: 'Purchases' },
  { value: 'TRANSFER', label: 'Transfers' },
]

/** Purchases and transfers are marked; plain expenses aren't, so the list stays quiet. */
function TypeChip({ type }: { type: Expense['entryType'] }) {
  if (type === 'EXPENSE') return null
  return <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide', type === 'PURCHASE' ? 'bg-[#E8F2FF] text-[#1367D8]' : 'bg-muted text-muted-foreground')}>{entryTypeLabel(type)}</span>
}

function StatusChip({ status }: { status: string }) {
  return <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-extrabold', expenseStatusClass(status))}>{expenseStatusLabel(status)}</span>
}

/** The design's expense table with search, filters and server-side pagination. */
export function ExpenseTable({ page }: { page: ExpensesModel }) {
  const { money, createInvoice, view, filters } = page
  const columns = useMemo(() => [
    column.display({ id: 'merchant', header: 'Merchant', meta: { headerClassName: 'px-5', cellClassName: 'px-5' }, cell: ({ row: { original } }) => <button type="button" onClick={() => view(original)} className="max-w-[240px] text-left"><p className="flex items-center gap-1.5"><span className="truncate font-extrabold hover:text-brand">{original.name || '—'}</span><TypeChip type={original.entryType}/></p><p className="mt-1 truncate text-[9px] text-muted-foreground">{original.reference} · {original.category || 'Uncategorised'}</p></button> }),
    column.display({ id: 'owner', header: 'Owner', cell: ({ row: { original } }) => <span className="font-bold text-foreground/70">{original.owner || '—'}</span> }),
    column.display({ id: 'date', header: 'Date', cell: ({ row: { original } }) => <span className="text-muted-foreground">{original.date || '—'}</span> }),
    column.display({ id: 'status', header: 'Status', cell: ({ row: { original } }) => <StatusChip status={original.status}/> }),
    column.display({ id: 'amount', header: 'Amount', meta: { headerClassName: 'text-right', cellClassName: 'text-right' }, cell: ({ row: { original } }) => <span className="font-extrabold">{money(original.amount)}</span> }),
    column.display({ id: 'invoice', header: 'Bill to client', meta: { headerClassName: 'px-5 text-right', cellClassName: 'px-5 text-right' }, cell: ({ row: { original } }) => <button type="button" onClick={() => createInvoice(original)} className="rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-extrabold text-brand hover:bg-accent">Create invoice</button> }),
  ], [money, createInvoice, view])

  return <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white">
    <div role="tablist" aria-label="Entry type" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-4 pt-3">
      {TYPE_FILTERS.map(item => {
        const active = filters.entryType === item.value
        return <button key={item.value} type="button" role="tab" aria-selected={active} onClick={() => filters.setEntryType(item.value)} className={cn('-mb-px shrink-0 border-b-2 px-3 pb-2.5 text-[11px] font-extrabold transition-colors', active ? 'border-secondary text-brand' : 'border-transparent text-muted-foreground hover:text-foreground')}>{item.label}</button>
      })}
    </div>
    <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
      <KitSearch value={filters.searchInput} onChange={filters.setSearch} placeholder="Search by merchant or reference"/>
      <DateRangeFilter value={filters.dateRange} onChange={filters.setDateRange} placeholder="All dates" className="w-full sm:w-auto"/>
      <KitButton variant={filters.active ? 'ghost' : 'secondary'} onClick={page.filterModal.open} className={filters.active ? 'border border-secondary bg-accent' : undefined}><SlidersHorizontal size={14}/> Filters</KitButton>
    </div>
    <DataTable
      columns={columns}
      data={page.rows}
      loading={page.loading}
      minWidthClassName="min-w-[760px]"
      className={cn(kitTableClass, '[&_tbody_tr]:static')}
      getRowId={row => row.id}
      emptyState={<KitEmpty icon={<CreditCard size={18}/>} title="Nothing found" note="Log spend with Record spend, or try other filters." className="py-4"/>}
      mobileListClassName="divide-y divide-border/70"
      renderMobileCard={row => <div className="p-4 text-xs">
        <button type="button" onClick={() => view(row)} className="flex w-full items-start justify-between gap-3 text-left">
          <span className="min-w-0"><span className="flex items-center gap-1.5"><span className="truncate font-extrabold">{row.name || '—'}</span><TypeChip type={row.entryType}/></span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{row.owner || row.reference} · {row.category || 'Uncategorised'} · {row.date}</span></span>
          <span className="shrink-0 text-right"><span className="block font-extrabold">{money(row.amount)}</span></span>
        </button>
        <div className="mt-3 flex items-center justify-between gap-3"><StatusChip status={row.status}/><button type="button" onClick={() => createInvoice(row)} className="rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-extrabold text-brand hover:bg-accent">Create invoice</button></div>
      </div>}
    />
    {page.pagination.pages > 1 && <Pagination currentPage={page.pagination.page} totalPages={page.pagination.pages} onPageChange={page.pagination.setPage} className="border-border"/>}

    <KitModal
      open={page.filterModal.isOpen}
      onClose={page.filterModal.close}
      title="Filter expenses"
      panelClassName="max-w-md"
      footer={<><KitButton variant="secondary" onClick={() => { filters.clear(); page.filterModal.close() }}>Clear</KitButton><KitButton onClick={page.filterModal.close}>Apply</KitButton></>}
    >
      <div className="flex flex-col gap-4">
        <KitSelect label="Category" value={filters.category} onChange={event => filters.setCategory(event.target.value)}>
          <option value="">All categories</option>
          {page.categoryOptions.map(option => <option key={option.id || option.name} value={option.id}>{option.name}</option>)}
        </KitSelect>
        <KitSelect label="Status" value={filters.status} onChange={event => filters.setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {EXPENSE_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </KitSelect>
      </div>
    </KitModal>
  </section>
}
