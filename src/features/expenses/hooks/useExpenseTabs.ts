import { useSearchParams } from 'react-router'
import { usePendingApprovalCount } from '@/api/expenses'
import { useSampleApprovalsStore } from '@/stores/sample-approvals-store'

export const EXPENSE_TABS = [
  { value: 'expenses', label: 'Expenses' },
  { value: 'approvals', label: 'Approvals' },
] as const

export type ExpenseTab = (typeof EXPENSE_TABS)[number]['value']

/** The Expenses | Approvals switch, kept in the URL (?tab=approvals) so links and refreshes land on the right tab. */
export function useExpenseTabs() {
  const [params, setParams] = useSearchParams()
  const tab: ExpenseTab = params.get('tab') === 'approvals' ? 'approvals' : 'expenses'
  const live = usePendingApprovalCount()
  const sample = useSampleApprovalsStore(state => state.items.filter(item => item.status === 'Pending').length)

  const setTab = (next: ExpenseTab) => setParams(current => {
    const updated = new URLSearchParams(current)
    if (next === 'expenses') updated.delete('tab')
    else updated.set('tab', next)
    return updated
  })

  return { tab, setTab, pendingCount: live + sample }
}
