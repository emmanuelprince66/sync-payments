import { useSearchParams } from 'react-router'
import { usePendingApprovalCount } from '@/api/expenses'

export const EXPENSE_TABS = [
  { value: 'expenses', label: 'Expenses' },
  { value: 'budgets', label: 'Budgets' },
  { value: 'approvals', label: 'Approvals' },
] as const

export type ExpenseTab = (typeof EXPENSE_TABS)[number]['value']

const isTab = (value: string | null): value is ExpenseTab => EXPENSE_TABS.some(item => item.value === value)

/** Expenses | Budgets | Approvals, kept in the URL (?tab=budgets) so links and refreshes land on the right tab. */
export function useExpenseTabs() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: ExpenseTab = isTab(requested) ? requested : 'expenses'
  const pendingCount = usePendingApprovalCount()

  const setTab = (next: ExpenseTab) => setParams(current => {
    const updated = new URLSearchParams(current)
    if (next === 'expenses') updated.delete('tab')
    else updated.set('tab', next)
    return updated
  })

  return { tab, setTab, pendingCount }
}
