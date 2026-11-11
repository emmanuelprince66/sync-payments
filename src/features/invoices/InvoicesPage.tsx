import { Download, Plus } from 'lucide-react'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { SampleDataBadge } from '@/components/ui/misc'
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
      badge={<SampleDataBadge/>}
      actions={<KitButton onClick={page.openForm}><Plus size={14}/> Create invoice</KitButton>}
    />
    <InvoiceStats stats={page.stats} isLoading={page.isLoading}/>
    <InvoiceAnalytics summary={page.summary} isLoading={page.isLoading}/>
    <InvoiceStudio template={page.template} onChoose={page.chooseTemplate}/>
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
        <DateRangeFilter value={page.dateRange} onChange={page.setDateRange} placeholder="All dates" className="flex-1 sm:flex-none"/>
        <KitButton variant="secondary" className="flex-1 sm:flex-none" onClick={page.exportCsv}><Download size={14}/> Export</KitButton>
      </>}
    />
  </KitPage>
}
