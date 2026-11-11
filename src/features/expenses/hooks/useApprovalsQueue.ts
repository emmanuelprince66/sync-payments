import { useMemo, useState } from 'react'
import { useExpensePermissions, useExpenseTransfers } from '@/api/expenses'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { useAuthStore } from '@/stores/auth-store'
import { fromTransfer } from '../approval-items'
import { useApprovalDecision } from './useApprovalDecision'

/** sink's ExpenseApprovals filters, in its order. 'ALL' is a value the list endpoint understands. */
export const APPROVAL_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_APPROVAL', label: 'Needs approval' },
  { value: 'PENDING_OWNER_APPROVAL', label: 'Awaiting owner' },
  { value: 'SUCCESS', label: 'Paid' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FAILED', label: 'Failed' },
] as const

export type ApprovalFilter = (typeof APPROVAL_FILTERS)[number]['value']

/**
 * The payout approval queue (sink: expenses/approvals). Opens on everything rather than the pending
 * slice, so "nothing waiting" and "nothing at all" don't look the same; "Needs approval" is one click away.
 */
export function useApprovalsQueue() {
  const userId = useAuthStore(state => String(state.user?.id ?? ''))
  const permissions = useExpensePermissions()
  const money = useFormatMoney()
  const decision = useApprovalDecision()
  const [filter, setFilter] = useState<ApprovalFilter>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 500)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const allowed = permissions.canApprove || permissions.canTransfer
  const transfers = useExpenseTransfers({ page, status: filter, search, limit: pageSize }, allowed)
  const items = useMemo(() => (transfers.data?.rows ?? []).map(row => fromTransfer(row, userId)), [transfers.data, userId])

  return {
    allowed,
    canApprove: permissions.canApprove,
    loading: transfers.isLoading && !transfers.data,
    refreshing: transfers.isFetching && Boolean(transfers.data),
    items,
    total: transfers.data?.total ?? 0,
    subtitle: permissions.canApprove
      ? 'Payouts waiting on a decision, and everything already decided.'
      : 'Where your requests got to. Someone with approval rights decides them.',
    /** What this person may release, said once at the top rather than discovered request by request. */
    capNote: permissions.canApprove && permissions.approvalCap !== null ? `You can approve up to ${money(permissions.approvalCap)}. Anything above that goes to the business owner.` : '',
    emptyNote: filter === 'PENDING_APPROVAL' ? 'No payouts are waiting on a decision.' : 'No transfers match this filter.',
    filter,
    setFilter: (value: ApprovalFilter) => { setFilter(value); setPage(1) },
    searchInput,
    setSearch: (value: string) => { setSearchInput(value); setPage(1) },
    pagination: {
      page,
      pages: transfers.data?.pages ?? 1,
      setPage,
      pageSize,
      setPageSize: (size: number) => { setPageSize(size); setPage(1) },
    },
    money,
    decision,
  }
}
