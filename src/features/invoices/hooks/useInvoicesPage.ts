import { useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  fetchInvoicesForExport, invoiceBalance, invoiceErrorMessage, invoicePaymentState, isInvoiceForbidden, INVOICES_PAGE_SIZE, useInvoiceAnalytics, useInvoices,
  type Invoice, type InvoiceDesign,
} from '@/api/invoices'
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useDebounce } from '@/hooks/useDebounce'
import { downloadCsv } from '@/lib/csv'
import { paths } from '@/routes/paths'
import { INVOICE_STATUS_FILTERS } from '../constants'

/** Invoices: summary cards and chart (analytics endpoint), server-side search, status, dates and pages. */
export function useInvoicesPage() {
  const navigate = useNavigate()

  const [template, setTemplate] = useState<InvoiceDesign>('Classic')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const dates = useDateRangeFilter({ onChange: () => setCurrentPage(1) })
  const term = useDebounce(search.trim(), 400)
  const filters = { search: term, status, customer: '', startDate: dates.startDate ?? '', endDate: dates.endDate ?? '' }

  const invoices = useInvoices({ ...filters, page: currentPage, limit: INVOICES_PAGE_SIZE })
  const analytics = useInvoiceAnalytics()
  const [exporting, setExporting] = useState(false)
  const error = invoices.error ?? analytics.error

  return {
    rows: invoices.data?.invoices ?? [],
    summary: analytics.data,
    analyticsLoading: analytics.isLoading,
    isLoading: invoices.isLoading,
    isFetching: invoices.isFetching && !invoices.isLoading,
    forbidden: isInvoiceForbidden(error),
    error: error ? invoiceErrorMessage(error, "Couldn't load invoices.") : '',
    retry: () => { void invoices.refetch(); void analytics.refetch() },
    template,
    search,
    status,
    statusOptions: INVOICE_STATUS_FILTERS.map(option => ({ value: option.value || 'all', label: option.label })),
    setStatus: (value: string) => { setStatus(value === 'all' ? '' : value); setCurrentPage(1) },
    dateRange: dates.range,
    setDateRange: dates.setRange,
    currentPage,
    totalPages: invoices.data?.pages ?? 1,
    setCurrentPage,
    setSearch: (value: string) => { setSearch(value); setCurrentPage(1) },
    openForm: () => navigate(paths.invoiceNew, { state: { template } }),
    chooseTemplate: (name: InvoiceDesign) => { setTemplate(name); navigate(paths.invoiceNew, { state: { template: name } }) },
    viewInvoice: (invoice: Invoice) => navigate(generatePath(paths.invoiceDetail, { invoiceId: invoice.id })),
    exporting,
    exportCsv: async () => {
      setExporting(true)
      try {
        const rows = await fetchInvoicesForExport(filters)
        if (!rows.length) return void toast.error('There are no invoices to export.')
        downloadCsv('invoices.csv', ['Invoice', 'Client', 'Issued', 'Due', 'Status', 'Amount', 'Paid', 'Balance', 'Design', 'Created by'],
          rows.map(row => [row.number, row.client, row.issued, row.due, invoicePaymentState(row), row.amount, row.amountPaid, invoiceBalance(row), row.design, row.createdBy]))
      } catch (exportError) {
        toast.error(invoiceErrorMessage(exportError, "Couldn't export invoices."))
      } finally {
        setExporting(false)
      }
    },
  }
}
