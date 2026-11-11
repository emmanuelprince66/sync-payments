import { useMemo, useState } from 'react'
import { useBudgets, useCategorySpend, useExpensePermissions, type Budget } from '@/api/expenses'
import { useExpenseCategories } from '@/api/transactions'
import { useFormatMoney } from '@/hooks/useFormatMoney'

/** Share of a budget used before it is flagged as running low. */
export const NEAR_LIMIT = 80

export type BudgetHealth = 'over' | 'near' | 'ok'

export type BudgetRow = Budget & {
  categoryId: string
  spent: number
  remaining: number
  percent: number
  health: BudgetHealth
}

/**
 * Budgets per expense category (sink: expenses/budgets + the "Categories & Budgets" cards).
 * Budget records carry only category_name, so spend and the category id are matched by name, as sink does.
 */
export function useBudgetsTab() {
  const money = useFormatMoney()
  const { isOwner, canLog } = useExpensePermissions()
  const budgets = useBudgets()
  const spend = useCategorySpend()
  const categories = useExpenseCategories()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<BudgetRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [preset, setPreset] = useState('')

  const rows = useMemo<BudgetRow[]>(() => (budgets.data ?? []).map(budget => {
    const category = spend.data?.find(row => row.name === budget.categoryName)
    const spent = category?.spent ?? 0
    const percent = budget.total > 0 ? Math.round((spent / budget.total) * 100) : 0
    const categoryId = categories.data?.find(row => row.name === budget.categoryName)?.id ?? category?.id ?? ''
    const health: BudgetHealth = percent >= 100 ? 'over' : percent >= NEAR_LIMIT ? 'near' : 'ok'
    return { ...budget, categoryId, spent, remaining: budget.total - spent, percent, health }
  }).sort((a, b) => b.percent - a.percent), [budgets.data, spend.data, categories.data])

  const term = search.trim().toLowerCase()
  const visible = term ? rows.filter(row => row.categoryName.toLowerCase().includes(term)) : rows
  const budgeted = rows.reduce((sum, row) => sum + row.total, 0)
  const spent = rows.reduce((sum, row) => sum + row.spent, 0)
  const over = rows.filter(row => row.health === 'over')
  const near = rows.filter(row => row.health === 'near')
  // Categories that have spend but nothing to measure it against.
  const unbudgeted = (spend.data ?? []).filter(row => row.spent > 0 && !rows.some(budget => budget.categoryName === row.name))

  return {
    loading: (budgets.isLoading && !budgets.data) || (spend.isLoading && !spend.data),
    /** Owners and people who log expenses set budgets (sink shows Create Budget to anyone on the page). */
    canManage: isOwner || canLog,
    money,
    rows: visible,
    count: rows.length,
    search,
    setSearch,
    summary: {
      budgeted: money(budgeted),
      spent: money(spent),
      remaining: money(budgeted - spent),
      percent: budgeted ? Math.round((spent / budgeted) * 100) : 0,
      overCount: over.length,
    },
    alerts: [
      ...over.map(row => ({ id: row.id, tone: 'over' as const, text: `${row.categoryName} is over budget by ${money(row.spent - row.total)} (${row.percent}% used).` })),
      ...near.map(row => ({ id: row.id, tone: 'near' as const, text: `${row.categoryName} has used ${row.percent}% of its budget. ${money(row.remaining)} left.` })),
    ],
    unbudgeted: unbudgeted.map(row => ({ id: categories.data?.find(category => category.name === row.name)?.id ?? row.id, name: row.name, spent: money(row.spent) })),
    modal: {
      open: creating || Boolean(editing),
      budget: editing,
      presetCategoryId: preset,
      close: () => { setCreating(false); setEditing(null) },
    },
    create: (categoryId = '') => { setEditing(null); setPreset(categoryId); setCreating(true) },
    edit: (row: BudgetRow) => { setCreating(false); setEditing(row) },
  }
}

export type BudgetsTabModel = ReturnType<typeof useBudgetsTab>
