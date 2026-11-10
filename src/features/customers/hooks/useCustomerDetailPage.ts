import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { CUSTOMER_TRANSACTION_TYPES, useCustomer, useCustomerTransactions, useDeleteCustomer, type CustomerTransactionType } from '@/api/customers'
import { formatShortDate } from '@/api/http'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { paths } from '@/routes/paths'

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
  const goBack = () => navigate(paths.customers)

  const data = detail.data
  const customer = data?.customer ?? null
  const address = customer?.address
  const dob = customer?.dateOfBirth ? (customer.dateOfBirth.length > 5 ? formatShortDate(`${customer.dateOfBirth.slice(0, 10)}T00:00:00`) : customer.dateOfBirth) : ''

  return {
    goBack,
    isLoading: detail.isLoading,
    isError: detail.isError,
    retry: () => void detail.refetch(),
    customer,
    tier: data?.tier ?? '',
    segment: data?.segment ?? '',
    insight: data?.insight ?? '',
    stats: data
      ? [
          { label: 'Total spend', value: money(data.totalSpend), note: `${data.totalOrders} order${data.totalOrders === 1 ? '' : 's'}` },
          { label: 'Average basket', value: money(data.averageBasket), note: 'Per order' },
          { label: 'Wallet balance', value: money(data.walletBalance), note: 'Held for this customer' },
          { label: 'Outstanding', value: money(data.outstandingBalance), note: data.outstandingBalance > 0 ? 'Owed to you' : 'Nothing owed' },
        ]
      : [],
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
