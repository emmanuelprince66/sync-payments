import { useState } from 'react'
import { toast } from 'sonner'
import { useBusinessBanks, useWalletAccount, type TransactionFilter } from '@/api/transactions'
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { exportTransactionsCsv } from '../format'
import { useTransactionDetails } from './useTransactionDetails'

export const TRANSACTION_FILTERS: readonly { value: TransactionFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'DEBIT', label: 'Debit' },
  { value: 'ONLINE', label: 'Online' },
]

/** Transactions screen: sink's filters (search, type, dates) with server-side pagination, on the selected account. */
export function useTransactionsPage() {
  const banks = useBusinessBanks()
  const money = useFormatMoney()
  const details = useTransactionDetails()
  const report = useDisclosure()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 500)
  const [filter, setFilter] = useState<TransactionFilter>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const dates = useDateRangeFilter({ onChange: () => setPage(1) })

  const account = useWalletAccount({ page, search, filter, startDate: dates.startDate, endDate: dates.endDate, limit: pageSize })
  const data = account.data
  const rows = data?.transactions ?? []

  const exportCsv = () => {
    if (!rows.length) { toast.info('There are no transactions to export for these filters.'); return }
    exportTransactionsCsv(rows)
    report.close()
  }

  return {
    loading: banks.loading || (account.isLoading && !data),
    noAccount: !banks.loading && !banks.selectedBankId && !data,
    refreshing: account.isFetching && Boolean(data),
    accountLabel: banks.selectedBank?.account_name || data?.wallet?.accountName || 'Main account',
    stats: {
      inflow: money(data?.inflow ?? 0),
      outflow: money(data?.outflow ?? 0),
      net: money((data?.inflow ?? 0) - (data?.outflow ?? 0)),
      count: data?.total ?? 0,
    },
    rows,
    filters: {
      searchInput,
      setSearch: (value: string) => { setSearchInput(value); setPage(1) },
      filter,
      setFilter: (value: TransactionFilter) => { setFilter(value); setPage(1) },
      dateRange: dates.range,
      setDateRange: dates.setRange,
    },
    report,
    exportCsv,
    pagination: { page, pages: data?.pages ?? 1, setPage, pageSize, setPageSize: (size: number) => { setPageSize(size); setPage(1) } },
    details,
  }
}
