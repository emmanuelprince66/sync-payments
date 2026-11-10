import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useBudgets, useCategorySpend, useExpensePermissions, useExpenses, useExpenseSettings, useExpenseTransactions, useSpendByUser, type Expense } from '@/api/expenses'
import { useBusinessBanks, useWalletAccount } from '@/api/transactions'
import { fromExpense } from '../approval-items'
import { useApprovalDecision } from './useApprovalDecision'
import { downloadCsv } from '@/features/transactions/format'
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { isoDay } from '@/lib/format'
import { paths } from '@/routes/paths'

export type ExpenseDraft = { merchant: string; amount: number; note?: string }

const PENDING = ['PENDING_APPROVAL', 'PENDING_OWNER_APPROVAL', 'PENDING']
const sum = (rows: Expense[]) => rows.reduce((total, row) => total + row.amount, 0)

const PALETTE = ['#529661', '#356C82', '#9A6A43', '#A76578', '#6FA0B5', '#C49168']

/** Everything the Expenses screen shows and does. */
export function useExpensesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const money = useFormatMoney()
  const permissions = useExpensePermissions()
  const banks = useBusinessBanks()
  const decision = useApprovalDecision()

  // A draft from Invoices opens the form once; clearing history state keeps a refresh from reopening it.
  const [draft, setDraft] = useState<ExpenseDraft | null>(() => (location.state as { draft?: ExpenseDraft } | null)?.draft ?? null)
  const [formOpen, setFormOpen] = useState(Boolean(draft))
  useEffect(() => {
    if ((location.state as { draft?: ExpenseDraft } | null)?.draft) navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null })
  }, [location.state, location.pathname, location.search, navigate])

  const [editing, setEditing] = useState<Expense | null>(null)
  const [viewing, setViewing] = useState<Expense | null>(null)
  const [justApprovedId, setJustApprovedId] = useState('')
  const audit = useDisclosure()
  const filterModal = useDisclosure()
  const categoriesModal = useDisclosure()
  const settingsModal = useDisclosure()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 500)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const dates = useDateRangeFilter({ onChange: () => setPage(1) })

  const list = useExpenses({ page, search, category, status, startDate: dates.startDate, endDate: dates.endDate })
  const transactions = useExpenseTransactions()
  const budgets = useBudgets()
  const categorySpend = useCategorySpend()
  const settings = useExpenseSettings()
  const spendByUser = useSpendByUser()

  const now = new Date()
  const monthStart = isoDay(new Date(now.getFullYear(), now.getMonth(), 1))
  const monthWallet = useWalletAccount({ page: 1, search: '', filter: 'ALL', startDate: monthStart, endDate: isoDay(now), limit: 1 })

  const stat = useMemo(() => {
    const rows = transactions.data ?? []
    const awaiting = rows.filter(row => PENDING.includes(row.status))
    const approved = rows.filter(row => row.status === 'APPROVED')
    const rejected = rows.filter(row => row.status === 'REJECTED')
    return { awaiting, approved, rejected }
  }, [transactions.data])

  const spent = list.data?.summary.spentThisMonth ?? 0
  const monthlyBudget = (budgets.data ?? []).reduce((total, budget) => total + budget.monthly, 0)
  const budgetPercent = monthlyBudget ? Math.min(Math.round((spent / monthlyBudget) * 100), 100) : 0
  const income = monthWallet.data?.inflow ?? 0
  const incomePercent = income ? Math.min(Math.round((Math.max(income - spent, 0) / income) * 100), 100) : 0
  const month = now.toLocaleDateString('en-US', { month: 'long' })

  const categories = useMemo(() => {
    const rows = [...(categorySpend.data ?? [])].sort((a, b) => b.spent - a.spent)
    const total = rows.reduce((value, row) => value + row.spent, 0)
    return rows.slice(0, 6).map((row, index) => ({ ...row, percent: total ? Math.round((row.spent / total) * 100) : 0, color: PALETTE[index % PALETTE.length], spentLabel: money(row.spent) }))
  }, [categorySpend.data, money])

  const budgetRows = useMemo(() => (budgets.data ?? []).slice(0, 4).map(budget => {
    const used = categorySpend.data?.find(row => row.name === budget.categoryName)?.spent ?? 0
    return { id: budget.id, label: budget.categoryName, amount: money(used), percent: budget.total ? Math.min(Math.round((used / budget.total) * 100), 100) : 0 }
  }), [budgets.data, categorySpend.data, money])

  const pendingRow = stat.awaiting.find(row => row.canApprove) ?? null
  const justApproved = justApprovedId ? (transactions.data ?? []).find(row => row.id === justApprovedId) ?? null : null
  const inline = pendingRow ?? justApproved

  const closeForm = () => { setFormOpen(false); setEditing(null); setDraft(null) }

  return {
    loading: list.isLoading && !list.data,
    statsLoading: (list.isLoading && !list.data) || transactions.isLoading,
    permissions,
    stats: {
      month: money(spent),
      monthNote: monthlyBudget ? `${budgetPercent}% of monthly budget` : 'No budget set yet',
      awaiting: money(sum(stat.awaiting)),
      awaitingNote: `${stat.awaiting.length} ${stat.awaiting.length === 1 ? 'request needs' : 'requests need'} review`,
      approved: money(sum(stat.approved)),
      approvedNote: `${stat.approved.length} approved`,
      savings: money(sum(stat.rejected)),
      savingsNote: `${stat.rejected.length} blocked by approvers`,
    },
    position: { month, value: money(income - spent), income: money(income), expenses: money(spent), percent: incomePercent, loading: monthWallet.isLoading },
    categories,
    categoriesLoading: categorySpend.isLoading,
    budget: { month, percent: budgetPercent, spent: money(spent), limit: monthlyBudget ? `${money(monthlyBudget)} limit` : 'No limit set', rows: budgetRows, loading: budgets.isLoading },
    spendByUser: (spendByUser.data ?? []).slice(0, 4).map(row => ({ id: row.id, name: row.name, total: money(row.total) })),
    policy: settings.data
      ? `${settings.data.requireApprovalForAll ? 'Every transfer needs an approver.' : 'Transfers under your limits go straight out.'} ${Number(settings.data.maxPerTransaction) > 0 ? `Up to ${money(Number(settings.data.maxPerTransaction))} per transaction.` : 'No per-transaction limit.'}`
      : 'Loading your approval policy…',
    settings: settings.data ?? null,

    inline: inline && {
      expense: inline,
      approved: inline.status === 'APPROVED',
      amount: money(inline.amount),
    },
    approveInline: () => {
      if (!pendingRow) return
      setJustApprovedId(pendingRow.id)
      decision.open(fromExpense(pendingRow))
    },
    scheduleTransfer: () => navigate(paths.payments, { state: { bankId: banks.banks.find(bank => bank.isExpenses)?.id } }),
    audit,

    filters: {
      searchInput,
      setSearch: (value: string) => { setSearchInput(value); setPage(1) },
      category,
      setCategory: (value: string) => { setCategory(value); setPage(1) },
      status,
      setStatus: (value: string) => { setStatus(value); setPage(1) },
      dateRange: dates.range,
      setDateRange: dates.setRange,
      active: Boolean(category || status),
      clear: () => { setCategory(''); setStatus(''); setPage(1) },
    },
    filterModal,
    categoryOptions: categorySpend.data ?? [],
    rows: list.data?.rows ?? [],
    pagination: { page, pages: list.data?.pages ?? 1, setPage },
    money,

    decision,
    form: {
      open: formOpen || Boolean(editing),
      editing,
      draft,
      start: () => { setEditing(null); setDraft(null); setFormOpen(true) },
      close: closeForm,
      done: (message: string) => { toast.success(message); closeForm() },
    },
    viewing,
    view: setViewing,
    closeView: () => setViewing(null),
    edit: (expense: Expense) => { setViewing(null); setEditing(expense) },
    categoriesModal,
    settingsModal,

    createInvoice: (expense: Expense) => navigate(paths.invoiceNew, { state: { draft: { client: '', amount: expense.amount, note: `Reimbursement for ${expense.name} · ${expense.reference}` } } }),
    exportCsv: () => {
      const rows = list.data?.rows ?? []
      if (!rows.length) { toast.info('There are no expenses to export for these filters.'); return }
      downloadCsv('expenses', [['Reference', 'Merchant', 'Category', 'Owner', 'Date', 'Status', 'Amount', 'Note'], ...rows.map(row => [row.reference, row.name, row.category, row.owner, row.date, row.status, row.amount, row.note])])
    },
  }
}

export type ExpensesModel = ReturnType<typeof useExpensesPage>
