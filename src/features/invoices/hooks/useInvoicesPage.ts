import { useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { invoiceBalance, invoicePaymentState, useInvoices, useInvoiceSummary, type Invoice, type InvoiceDesign } from '@/api/invoices'
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useDebounce } from '@/hooks/useDebounce'
import { downloadCsv } from '@/lib/csv'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

const sumBalances = (rows: Invoice[]) => rows.reduce((sum, row) => sum + invoiceBalance(row), 0)

export function useInvoicesPage() {
  const navigate = useNavigate()

  const invoices = useInvoices()
  const summary = useInvoiceSummary()

  const [template, setTemplate] = useState<InvoiceDesign>('Classic')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const dates = useDateRangeFilter({ onChange: () => setCurrentPage(1) })
  const term = useDebounce(search, 200).trim().toLowerCase()

  // The sample list has no server query yet, so the range filters on the issue date here.
  const inRange = useMemo(() => (invoices.data ?? []).filter(row => (!dates.startDate || row.issued >= dates.startDate) && (!dates.endDate || row.issued <= dates.endDate)), [invoices.data, dates.startDate, dates.endDate])
  const filtered = useMemo(() => inRange.filter(row => !term || row.id.toLowerCase().includes(term) || row.client.toLowerCase().includes(term)), [inRange, term])

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const page = Math.min(currentPage, totalPages)
  const rows = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const stats = useMemo(() => {
    const states = inRange.map(row => ({ row, state: invoicePaymentState(row) }))
    const open = states.filter(({ state }) => state !== 'Paid' && state !== 'Draft').map(({ row }) => row)
    const overdue = states.filter(({ state }) => state === 'Overdue').map(({ row }) => row)
    return { outstanding: sumBalances(open), outstandingCount: open.length, overdue: sumBalances(overdue), overdueCount: overdue.length, summary: summary.data }
  }, [inRange, summary.data])

  return {
    rows,
    stats,
    summary: summary.data,
    isLoading: invoices.isLoading || summary.isLoading,
    template,
    search,
    dateRange: dates.range,
    setDateRange: dates.setRange,
    currentPage: page,
    totalPages,
    setCurrentPage,
    setSearch: (value: string) => { setSearch(value); setCurrentPage(1) },
    openForm: () => navigate(paths.invoiceNew, { state: { template } }),
    chooseTemplate: (name: InvoiceDesign) => { setTemplate(name); navigate(paths.invoiceNew, { state: { template: name } }) },
    viewInvoice: (invoice: Invoice) => navigate(generatePath(paths.invoiceDetail, { invoiceId: invoice.id })),
    exportCsv: () => {
      if (!filtered.length) return toast.error('There are no invoices to export.')
      downloadCsv('invoices.csv', ['Invoice', 'Client', 'Issued', 'Due', 'Status', 'Amount', 'Paid', 'Balance', 'Created by'], filtered.map(row => [row.id, row.client, row.issued, row.due, invoicePaymentState(row), row.amount, row.amountPaid, invoiceBalance(row), row.createdBy]))
    },
  }
}
