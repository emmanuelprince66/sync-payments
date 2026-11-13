import { usePermissions } from '@/hooks/usePermissions'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { CUSTOMER_STATUS_OPTIONS, useCustomers, useDeleteCustomer, type Customer, type CustomerStatusFilter } from '@/api/customers'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { paths } from '@/routes/paths'
import { useCustomerInvoices } from './useCustomerInvoices'

export type CustomerDialog = { mode: 'add' } | { mode: 'edit'; customer: Customer } | null

/** Customers: server-side search, status filter and pages; add, edit, delete; open a customer's profile. */
export function useCustomersPage() {
  const navigate = useNavigate()
  const money = useFormatMoney()
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<CustomerStatusFilter>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [dialog, setDialog] = useState<CustomerDialog>(null)
  const [toDelete, setToDelete] = useState<Customer | null>(null)
  const debounced = useDebounce(searchInput.trim(), 500)
  // Sink only sends a search from three characters.
  const search = debounced.length >= 3 ? debounced : ''
  const query = useCustomers({ page, limit: pageSize, search, status })
  const remove = useDeleteCustomer()
  const customers = useMemo(() => query.data?.customers ?? [], [query.data])
  const summary = query.data?.summary
  // One customer-summaries request for the customers on this page.
  const invoices = useCustomerInvoices(useMemo(() => customers.map(customer => customer.id), [customers]))
  const { totals, forCustomer } = invoices
  /** Invoice figures per row: total paid, and what's still owed ("At risk" when anything is). */
  const invoiceFigures = useCallback((customer: Customer) => {
    if (invoices.unavailable) return { paid: '—', paidNote: 'Invoices unavailable', unpaid: '—', atRisk: false }
    if (invoices.rowsLoading) return { paid: '…', paidNote: 'Loading invoices', unpaid: '…', atRisk: false }
    const figures = forCustomer(customer.id)
    const note = figures.invoiceCount ? `Across ${figures.invoiceCount} invoice${figures.invoiceCount === 1 ? '' : 's'}${figures.overdue > 0 ? `, ${money(figures.overdue)} overdue` : ''}` : 'No invoices yet'
    return { paid: money(figures.totalPaid), paidNote: note, unpaid: money(figures.totalUnpaid), atRisk: figures.totalUnpaid > 0 }
  }, [forCustomer, money, invoices.unavailable, invoices.rowsLoading])

  const permissions = usePermissions()
  return {
    /** sink Customers / Contact: customers:create, customers:edit (fallback everyone), customers:delete (fallback admins). */
    can: { add: permissions.canAddCustomers, edit: permissions.canEditCustomers, delete: permissions.canDeleteCustomers },
    searchInput,
    setSearch: (value: string) => { setSearchInput(value); setPage(1) },
    status,
    statusOptions: CUSTOMER_STATUS_OPTIONS.map(option => ({ value: option.value || 'all', label: option.label })),
    setStatus: (value: string) => { setStatus((value === 'all' ? '' : value) as CustomerStatusFilter); setPage(1) },
    customers,
    invoiceFigures,
    stats: summary && !totals.isLoading
      ? [
          { label: 'Customers', value: summary.count.toLocaleString(), note: 'On your customer list' },
          ...(totals.unavailable ? [] : [
          { label: 'Unpaid invoices', value: money(totals.expectedCash), note: totals.openCount ? `Owed on ${totals.openCount} invoice${totals.openCount === 1 ? '' : 's'}${totals.overdueCount ? `, ${totals.overdueCount} overdue` : ''}` : 'Nothing owed', danger: totals.expectedCash > 0 },
          { label: 'Paid this month', value: money(totals.paidThisMonth), note: totals.paidChange === '—' ? 'Collected on invoices this month' : totals.paidChange },
          ]),
        ]
      : null,
    isLoading: query.isLoading,
    isFetching: query.isFetching && !query.isLoading,
    isError: query.isError,
    retry: () => void query.refetch(),
    isFiltered: Boolean(search || status),
    page,
    totalPages: query.data?.pages ?? 1,
    setPage,
    pageSize,
    setPageSize: (size: number) => { setPageSize(size); setPage(1) },
    openCustomer: (customer: Customer) => navigate(`${paths.customers}/${customer.id}`),
    dialog,
    openAdd: () => setDialog({ mode: 'add' }),
    openEdit: (customer: Customer) => setDialog({ mode: 'edit', customer }),
    closeDialog: () => setDialog(null),
    toDelete,
    askDelete: setToDelete,
    cancelDelete: () => setToDelete(null),
    isDeleting: remove.isPending,
    confirmDelete: (customer: Customer) => remove.mutate(customer.id, {
      onSuccess: () => { toast.success(`${customer.name} deleted`); setToDelete(null) },
      onError: error => toast.error(errorMessage(error, 'Could not delete this customer.')),
    }),
  }
}

export type CustomersPageModel = ReturnType<typeof useCustomersPage>
