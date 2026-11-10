import { useMemo, useState } from 'react'
import { useExpensePermissions, useExpenses, useExpenseTransfers } from '@/api/expenses'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { useAuthStore } from '@/stores/auth-store'
import { useSampleApprovalsStore } from '@/stores/sample-approvals-store'
import { fromExpense, fromSample, fromTransfer } from '../approval-items'
import { useApprovalDecision } from './useApprovalDecision'

export const APPROVAL_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_APPROVAL', label: 'Needs approval' },
  { value: 'PENDING_OWNER_APPROVAL', label: 'Awaiting owner' },
  { value: 'REJECTED', label: 'Rejected' },
] as const

export type ApprovalFilter = (typeof APPROVAL_FILTERS)[number]['value']

const ROLE_TITLES: Record<string, string> = { OWNER: 'Business owner', ACCOUNTANT: 'Accountant', 'ADMIN-ATTENDANT': 'Administrator' }

/** Real expense and transfer approvals plus the session's sample items, one queue. */
export function useApprovalsQueue() {
  const user = useAuthStore(state => state.user)
  const permissions = useExpensePermissions()
  const money = useFormatMoney()
  const decision = useApprovalDecision()
  const [filter, setFilter] = useState<ApprovalFilter>('ALL')
  const [page, setPage] = useState(1)

  const status = filter === 'ALL' ? '' : filter
  const allowed = permissions.canApprove || permissions.canTransfer
  const expenses = useExpenses({ page, search: '', category: '', status, startDate: '', endDate: '' })
  const transfers = useExpenseTransfers({ page, status, search: '' }, allowed)
  const sample = useSampleApprovalsStore(state => state.items)

  const items = useMemo(() => {
    const samples = sample.map(fromSample).filter(item => filter === 'ALL' || (filter === 'PENDING_APPROVAL' && item.status === 'Awaiting approval') || (filter === 'REJECTED' && item.status === 'Rejected'))
    const live = [...(expenses.data?.rows ?? []).map(fromExpense), ...(transfers.data?.rows ?? []).map(row => fromTransfer(row, String(user?.id ?? ''), money))]
    // Items needing a decision first; each list already comes newest first.
    return [...samples, ...live].sort((a, b) => Number(b.canDecide) - Number(a.canDecide))
  }, [expenses.data, transfers.data, sample, filter, user?.id, money])

  const waiting = (expenses.data?.rows ?? []).filter(row => row.canApprove).length + (transfers.data?.rows ?? []).filter(row => row.canApprove).length + sample.filter(item => item.status === 'Pending').length

  const firstName = user?.firstname || user?.name?.split(/\s+/)[0] || 'Your'
  return {
    allowed,
    loading: (expenses.isLoading && !expenses.data) || (allowed && transfers.isLoading && !transfers.data),
    items,
    waiting,
    filter,
    setFilter: (value: ApprovalFilter) => { setFilter(value); setPage(1) },
    pagination: { page, pages: Math.max(expenses.data?.pages ?? 1, transfers.data?.pages ?? 1), setPage },
    queueTitle: firstName === 'Your' ? 'Your approval queue' : `${firstName}’s approval queue`,
    queueNote: `${(user?.role && ROLE_TITLES[user.role]) || 'Team member'} · ${permissions.approvalCap === null ? 'no personal approval limit' : `can approve payments up to ${money(permissions.approvalCap)}`}`,
    decision,
  }
}
