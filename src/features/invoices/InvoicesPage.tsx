import { Download, Plus } from 'lucide-react'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { InvoiceAccessNotice } from './components/InvoiceAccessNotice'
import { InvoiceAnalytics } from './components/InvoiceAnalytics'
import { InvoiceStats } from './components/InvoiceStats'
import { InvoiceStudio } from './components/InvoiceStudio'
import { InvoicesTable } from './components/InvoicesTable'
import { useInvoicesPage } from './hooks/useInvoicesPage'

export default function InvoicesPage() {
  const page = useInvoicesPage()
  return <KitPage>
    <KitPageHeader
      title="Invoices"
      subtitle="Create, send, and automatically reconcile client invoices."
      actions={!page.forbidden && page.canCreate && <KitButton onClick={page.openForm}><Plus size={14}/> Create invoice</KitButton>}
    />
    {page.error && !page.rows.length && !page.isLoading
      ? <InvoiceAccessNotice forbidden={page.forbidden} message={page.error} onRetry={page.retry}/>
      : <>
        <InvoiceStats summary={page.summary} isLoading={page.analyticsLoading}/>
        <InvoiceAnalytics summary={page.summary} isLoading={page.analyticsLoading}/>
        <InvoiceStudio template={page.template} onChoose={page.chooseTemplate}/>
        <div className={cn('transition-opacity', page.isFetching && 'opacity-60')}>
          <InvoicesTable
            rows={page.rows}
            isLoading={page.isLoading}
            search={page.search}
            onSearch={page.setSearch}
            currentPage={page.currentPage}
            totalPages={page.totalPages}
            onPageChange={page.setCurrentPage}
            onView={page.viewInvoice}
            actions={<>
              <Select aria-label="Filter by status" options={page.statusOptions} value={page.status || 'all'} onValueChange={page.setStatus} className="flex-1 sm:w-[150px] sm:flex-none" boxClassName="h-10 border-border px-3 text-xs font-bold text-foreground"/>
              <DateRangeFilter value={page.dateRange} onChange={page.setDateRange} placeholder="All dates" className="flex-1 sm:flex-none"/>
              <KitButton variant="secondary" className="flex-1 sm:flex-none" loading={page.exporting} onClick={() => void page.exportCsv()}><Download size={14}/> Export</KitButton>
            </>}
          />
        </div>
      </>}
  </KitPage>
}
