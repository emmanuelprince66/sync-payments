import { useSearchParams } from 'react-router'
import { useExpensePermissions, usePendingApprovalCount } from '@/api/expenses'

const ALL_TABS = [
  { value: 'expenses', label: 'Expenses' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'budgets', label: 'Budgets' },
  { value: 'approvals', label: 'Approvals' },
  { value: 'settings', label: 'Settings' },
] as const

export type ExpenseTab = (typeof ALL_TABS)[number]['value']
export type ExpenseSettingsSection = 'expense-rules' | 'approval-rights'

const isSection = (value: string | null): value is ExpenseSettingsSection => value === 'expense-rules' || value === 'approval-rights'

/**
 * Expenses | Accounts | Budgets | Approvals | Settings, kept in the URL (?tab=settings&section=approval-rights) so links
 * and refreshes land on the right place. Settings is only offered to the owner and admins; anyone else asking for it
 * lands on Expenses.
 */
export function useExpenseTabs() {
  const [params, setParams] = useSearchParams()
  const { isAdmin } = useExpensePermissions()
  const tabs = ALL_TABS.filter(item => item.value !== 'settings' || isAdmin)
  const requested = params.get('tab')
  const tab: ExpenseTab = tabs.find(item => item.value === requested)?.value ?? 'expenses'
  const requestedSection = params.get('section')
  const section: ExpenseSettingsSection = isSection(requestedSection) ? requestedSection : 'expense-rules'
  const pendingCount = usePendingApprovalCount()

  const update = (next: ExpenseTab, nextSection?: ExpenseSettingsSection) => setParams(current => {
    const updated = new URLSearchParams(current)
    if (next === 'expenses') updated.delete('tab')
    else updated.set('tab', next)
    if (next === 'settings' && nextSection) updated.set('section', nextSection)
    if (next !== 'settings') updated.delete('section')
    return updated
  })

  return {
    tabs,
    tab,
    setTab: (next: ExpenseTab) => update(next),
    section,
    setSection: (next: ExpenseSettingsSection) => update('settings', next),
    canOpenSettings: isAdmin,
    openSettings: (next: ExpenseSettingsSection = 'expense-rules') => update('settings', next),
    pendingCount,
  }
}
