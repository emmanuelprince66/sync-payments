import { usePermissions } from '@/hooks/usePermissions'
import { useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { CUSTOMER_TRANSACTION_TYPES, useCustomer, useCustomerTransactions, useDeleteCustomer, type CustomerTransactionType } from '@/api/customers'
import { formatShortDate } from '@/api/http'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { paths } from '@/routes/paths'
import { useCustomerInvoiceDetail } from './useCustomerInvoices'

const TRANSACTIONS_PAGE_SIZE = 10

const GENDER_LABELS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }

/** A customer's profile (customer/single/{id}/) and transaction ledger (customer/transactions/{id}/), with edit and delete. */
export function useCustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const money = useFormatMoney()
  const detail = useCustomer(customerId)
  const [type, setType] = useState<CustomerTransactionType>('ALL')
  const [page, setPage] = useState(1)
  const transactions = useCustomerTransactions(customerId, { page, limit: TRANSACTIONS_PAGE_SIZE, type })
  const edit = useDisclosure()
  const confirmDelete = useDisclosure()
  const remove = useDeleteCustomer()
  const invoiceStore = useCustomerInvoiceDetail(customerId)
  const goBack = () => navigate(paths.customers)

  const data = detail.data
  const customer = data?.customer ?? null
  const address = customer?.address
  const invoices = customer && !invoiceStore.unavailable ? invoiceStore.figures : null
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
  const dob = customer?.dateOfBirth ? (customer.dateOfBirth.length > 5 ? formatShortDate(`${customer.dateOfBirth.slice(0, 10)}T00:00:00`) : customer.dateOfBirth) : ''

  const permissions = usePermissions()
  return {
    /** sink Customers / Contact: customers:create, customers:edit (fallback everyone), customers:delete (fallback admins). */
    can: { add: permissions.canAddCustomers, edit: permissions.canEditCustomers, delete: permissions.canDeleteCustomers },
    goBack,
    isLoading: detail.isLoading,
    isError: detail.isError,
    retry: () => void detail.refetch(),
    customer,
    tier: data?.tier ?? '',
    segment: data?.segment ?? '',
    insight: data?.insight ?? '',
    statsLoading: invoiceStore.isLoading,
    /** Invoice figures: totals from invoices/customers/{id}/summary/, counts from the customer's invoice list. */
    stats: invoices
      ? [
          { label: 'Invoices paid', value: money(invoices.paid), note: `${plural(invoices.paidCount, 'invoice')} paid in full`, danger: false },
          { label: 'Unpaid', value: money(invoices.unpaid), note: invoices.unpaidCount ? `Owed on ${plural(invoices.unpaidCount, 'invoice')}` : 'Nothing owed', danger: invoices.unpaid > 0 },
          { label: 'Overdue', value: money(invoices.overdue), note: invoices.overdueCount ? `${plural(invoices.overdueCount, 'invoice')} past due` : 'Nothing overdue', danger: invoices.overdue > 0 },
          { label: 'Invoices', value: invoices.count.toLocaleString(), note: 'Sent to this customer', danger: false },
        ]
      : [],
    atRisk: invoices?.atRisk ?? false,
    unpaid: money(invoices?.unpaid ?? 0),
    invoices: {
      rows: invoiceStore.rows.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        issued: formatShortDate(`${invoice.issued}T00:00:00`),
        due: formatShortDate(`${invoice.due}T00:00:00`),
        amount: money(invoice.amount),
        balance: invoice.balance > 0 && invoice.state !== 'Draft' ? money(invoice.balance) : '',
        state: invoice.state,
      })),
      isLoading: invoiceStore.isLoading,
      open: (id: string) => navigate(generatePath(paths.invoiceDetail, { invoiceId: id })),
      create: () => navigate(paths.invoiceNew),
    },
    details: customer
      ? [
          ['Phone', customer.phone || '—'],
          ['Email', customer.email || '—'],
          ['Gender', GENDER_LABELS[customer.gender] ?? '—'],
          ['Date of birth', dob || '—'],
          ['Address', address ? [address.address, address.city, address.state].filter(Boolean).join(', ') : '—'],
          ['Customer since', data?.customerSince || '—'],
          ['Last purchase', data?.lastPurchase ? formatShortDate(data.lastPurchase) : '—'],
          ['Favourite product', data?.favouriteProduct || '—'],
          ['Preferred payment', data?.preferredPayment || '—'],
        ] as [string, string][]
      : [],
    transactions: {
      types: CUSTOMER_TRANSACTION_TYPES,
      type,
      setType: (next: CustomerTransactionType) => { setType(next); setPage(1) },
      rows: transactions.data?.rows ?? [],
      isLoading: transactions.isLoading,
      isFetching: transactions.isFetching && !transactions.isLoading,
      isError: transactions.isError,
      page,
      pages: transactions.data?.pages ?? 1,
      setPage,
    },
    edit,
    confirmDelete,
    isDeleting: remove.isPending,
    deleteCustomer: () => customer && remove.mutate(customer.id, {
      onSuccess: () => { toast.success(`${customer.name} deleted`); goBack() },
      onError: error => toast.error(errorMessage(error, 'Could not delete this customer.')),
    }),
  }
}

export type CustomerDetailModel = ReturnType<typeof useCustomerDetailPage>
