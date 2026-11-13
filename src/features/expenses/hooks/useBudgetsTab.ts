import { useMemo, useState } from 'react'
import { useBudgets, useCategorySpend, useExpensePermissions, type Budget } from '@/api/expenses'
import { useFormatMoney } from '@/hooks/useFormatMoney'

/** Share of a budget used before it is flagged as running low. */
export const NEAR_LIMIT = 80

export type BudgetHealth = 'over' | 'near' | 'ok'

export type BudgetRow = Budget & {
  percent: number
  health: BudgetHealth
}

const THIS_YEAR = new Date().getFullYear()
export const BUDGET_YEARS = [THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1]

/**
 * Budgets per expense category for one year (sink: expenses/budgets + the "Categories & Budgets" cards).
 * GET expenses/business/{id}/budgets/?year= already carries category_id, spent, remaining and pct_used, so those are
 * used as they come; category spend is only read to find categories that have spend but no budget (joined by id).
 */
export function useBudgetsTab() {
  const money = useFormatMoney()
  const { isOwner, canLog } = useExpensePermissions()
  const [year, setYear] = useState(THIS_YEAR)
  const budgets = useBudgets(year)
  const spend = useCategorySpend()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<BudgetRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [preset, setPreset] = useState('')

  const rows = useMemo<BudgetRow[]>(() => (budgets.data ?? []).map(budget => {
    const percent = Math.round(budget.pctUsed)
    const health: BudgetHealth = percent >= 100 ? 'over' : percent >= NEAR_LIMIT ? 'near' : 'ok'
    return { ...budget, percent, health }
  }).sort((a, b) => b.percent - a.percent), [budgets.data])

  const term = search.trim().toLowerCase()
  const visible = term ? rows.filter(row => row.categoryName.toLowerCase().includes(term)) : rows
  const budgeted = rows.reduce((sum, row) => sum + row.total, 0)
  const spent = rows.reduce((sum, row) => sum + row.spent, 0)
  const over = rows.filter(row => row.health === 'over')
  const near = rows.filter(row => row.health === 'near')
  // Categories that have spend this year but nothing to measure it against (category spend is this year's).
  const unbudgeted = year === THIS_YEAR ? (spend.data ?? []).filter(row => row.spent > 0 && !rows.some(budget => budget.categoryId === row.id)) : []

  return {
    loading: (budgets.isLoading && !budgets.data) || (spend.isLoading && !spend.data),
    /** Owners and people who log expenses set budgets (sink shows Create Budget to anyone on the page). */
    canManage: isOwner || canLog,
    money,
    rows: visible,
    count: rows.length,
    year,
    years: BUDGET_YEARS,
    setYear,
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
    unbudgeted: unbudgeted.map(row => ({ id: row.id, name: row.name, spent: money(row.spent) })),
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
