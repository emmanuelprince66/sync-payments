import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Download, FileText } from 'lucide-react'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { KitFilterPills, KitModal, KitSearch, StatTile, StatTileSkeleton } from '@/components/ui/KitExtras'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { Pagination } from '@/components/ui/Pagination'
import { KitButton } from '@/components/ui/PaymentKit'
import { TransactionDialogs } from './components/TransactionDialogs'
import { TransactionTable } from './components/TransactionTable'
import { TRANSACTION_FILTERS, useTransactionsPage } from './hooks/useTransactionsPage'

export default function TransactionsPage() {
  const page = useTransactionsPage()
  const { filters } = page

  return <KitPage>
    <KitPageHeader
      title="Transactions"
      subtitle="Monitor every payment collected through your account and terminals."
      actions={<div className="flex gap-2">
        <KitButton variant="secondary" onClick={page.exportCsv}><Download size={14}/> Export CSV</KitButton>
        <KitButton onClick={page.report.open}><FileText size={14}/> Generate report</KitButton>
      </div>}
    />

    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
      {page.loading
        ? Array.from({ length: 3 }, (_, index) => <StatTileSkeleton key={index}/>)
        : <>
          <StatTile label="Total inflow" value={page.stats.inflow} note="In selected period" icon={ArrowDownLeft}/>
          <StatTile label="Total outflow" value={page.stats.outflow} note="In selected period" icon={ArrowUpRight} tone="amber"/>
          <StatTile label="Net processed" value={page.stats.net} note={`${page.stats.count.toLocaleString()} transactions`} icon={CircleDollarSign} tone="blue"/>
        </>}
    </div>

    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
        <KitSearch value={filters.searchInput} onChange={filters.setSearch} placeholder="Search by customer, ID, or reference"/>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <KitFilterPills value={filters.filter} options={TRANSACTION_FILTERS} onChange={filters.setFilter}/>
        </div>
        <DateRangeFilter value={filters.dateRange} onChange={filters.setDateRange} placeholder="All dates" className="w-full md:w-auto"/>
      </div>
      <TransactionTable rows={page.rows} loading={page.loading} accountLabel={page.accountLabel} onSelect={page.details.open} emptyNote={page.noAccount ? 'Open your business account to start collecting payments.' : 'Try another filter or date range.'}/>
      <Pagination currentPage={page.pagination.page} totalPages={page.pagination.pages} onPageChange={page.pagination.setPage} pageSize={page.pagination.pageSize} onPageSizeChange={page.pagination.setPageSize} className="border-border"/>
    </section>

    <KitModal
      open={page.report.isOpen}
      onClose={page.report.close}
      title="Generate report"
      description="Export the transactions that match your current filters."
      icon={<FileText size={16}/>}
      panelClassName="max-w-md"
      footer={<><KitButton variant="secondary" onClick={page.report.close}>Cancel</KitButton><KitButton onClick={page.exportCsv}><Download size={14}/> Generate report</KitButton></>}
    >
      <div className="rounded-xl bg-[#F8FAF8] p-4 text-[10px] leading-4 text-muted-foreground">
        <p className="text-xs font-extrabold text-foreground">Statement · CSV</p>
        <p className="mt-1">Includes ID, reference, customer, type, channel, amount, charges, account, date, status and description for {page.accountLabel}.</p>
      </div>
    </KitModal>

    <TransactionDialogs details={page.details} accountLabel={page.accountLabel}/>
  </KitPage>
}
