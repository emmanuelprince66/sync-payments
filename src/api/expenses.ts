import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { useCurrentBusinessId } from './business'
import { asRecord, at, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'

/**
 * Expenses, budgets and approval governance, same endpoints as sink-inventory (hooks/useExpensesHook,
 * useExpenseAccountsHook, api/expenses/*, types/expense-governance):
 *  GET/POST     expenses/business/{id}/                 list (results.{data,total_expenses,summary}) / log an expense
 *  GET/PATCH/DELETE expenses/{id}/
 *  POST         expenses/{id}/approve/ { pin }          signing off a LOGGED expense: nothing is disbursed
 *  POST         expenses/{id}/reject/  { rejection_reason }
 *  GET/POST     expenses/business/{id}/budgets/         { category_id, year, total_budget_amount, duration_months }
 *  PATCH/DELETE expenses/business/{id}/budgets/{budget_id}/
 *  GET          expenses/business/{id}/categories/      spent + budget per category
 *  GET          expenses/business/{id}/transactions/    logged expenses and transfers together
 *  GET          expenses/business/{id}/recent-activity/
 *  GET          expenses/business/{id}/spend-by-user/
 *  GET          expenses/transfers/{id}/                payout requests
 *  POST         expenses/transfers/initiate/{id}/       { business_id, amount, account_number, bank_code, category_id?, narration?, pin }
 *  POST         expenses/transfers/{id}/approve/ { pin } dispatches the payout
 *  POST         expenses/transfers/{id}/reject/  { rejection_reason }
 *  GET/PATCH    expenses/settings/{id}/                 limits and approval policy (owner writes)
 */

export const EXPENSES_PAGE_SIZE = 20

// ─── Permissions (sink: useExpensePermissions) ──────────────────────────────

const capOf = (value: unknown, isOwner: boolean) => {
  if (isOwner || value === null || value === undefined || value === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export const useExpensePermissions = () => {
  const user = useAuthStore(state => state.user)
  const isOwner = !user?.role || user.role === 'OWNER'
  const permissions = (user?.permissions ?? {}) as Record<string, unknown>
  const can = (key: string) => isOwner || permissions[key] === true
  const canLog = can('can_log_expenses')
  const canTransfer = can('can_initiate_expense_transfer')
  // Accountants approve by role; whether a given item is approvable still comes from can_current_user_approve.
  const canApprove = can('can_approve_expenses') || user?.role === 'ACCOUNTANT'
  return { canLog, canTransfer, canApprove, isOwner, transferCap: capOf(permissions.max_expense_transfer_amount, isOwner), approvalCap: capOf(permissions.max_expense_approval_amount, isOwner) }
}

/** The bank charge for an expense payout (sink: estimateCharges). The backend's number is the one that counts. */
export const estimateExpenseCharges = (amount: number) => (!Number.isFinite(amount) || amount <= 0 ? 0 : amount <= 50_000 ? 25 : amount < 500_000 ? 50 : 100)

/** The OpenAPI schema types can_current_user_approve loosely, so the string forms are handled (sink: canCurrentUserApprove). */
const canCurrentUserApprove = (value: unknown) =>
  typeof value === 'string' ? !['false', '0', '', 'null', 'none', 'undefined'].includes(value.toLowerCase().trim()) : Boolean(value)

/** A category/user may arrive as a plain string or as an object with a name. */
const refLabel = (value: unknown) => str(value) || str(asRecord(value).name) || str(asRecord(value).fullname)
const refId = (value: unknown) => str(asRecord(value).id)

/** sink's unwrapPaginated: the expense endpoints each nest their rows differently. */
const paginated = (raw: unknown, limit: number) => {
  const rows = listFrom(raw, ['results', 'results.data', 'results.transactions', 'results.activities', 'data', 'data.data', 'transactions', 'table', 'table.results'])
  const total = num(at(raw, 'total')) || num(at(raw, 'count')) || num(at(raw, 'results.summary.result_count')) || rows.length
  return { rows, total, pages: Math.max(num(at(raw, 'pages')) || Math.ceil(total / limit), 1) }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type Expense = {
  id: string
  reference: string
  name: string
  category: string
  categoryId: string
  amount: number
  date: string
  note: string
  status: string
  owner: string
  approvedBy: string
  rejectedBy: string
  rejectionReason: string
  canApprove: boolean
  createdAt: string
}

export type ExpenseSummary = { spentThisMonth: number; accountBalance: number; bankName: string; accountNumber: string }
export type ExpensesPageData = { rows: Expense[]; total: number; pages: number; totalExpenses: number; summary: ExpenseSummary }
export type ExpenseQuery = { page: number; search: string; category: string; status: string; startDate: string; endDate: string; limit?: number }
export type ExpenseInput = { name: string; categoryId: string; amount: number; date: string; note?: string }

export type Budget = { id: string; categoryName: string; year: number; total: number; months: number; monthly: number }
export type BudgetInput = { categoryId: string; year: number; total: number; months: number }
export type CategorySpend = { id: string; name: string; spent: number; count: number; budget: number }
export type ActivityRow = { id: string; name: string; category: string; by: string; amount: number; status: string; createdAt: string }
export type UserSpend = { id: string; name: string; total: number }
export type ExpenseSettings = { maxPerTransaction: string; dailyTransferLimit: string; dailyTransactionLimit: number; requireApprovalForAll: boolean }

export type ExpenseTransfer = {
  id: string
  reference: string
  amount: number
  charges: number
  category: string
  beneficiaryName: string
  beneficiaryAccount: string
  beneficiaryBank: string
  narration: string
  status: string
  initiatedBy: string
  initiatedByName: string
  approvedByName: string
  rejectionReason: string
  canApprove: boolean
  createdAt: string
}

// ─── Mappers ────────────────────────────────────────────────────────────────

const mapExpense = (value: unknown): Expense => {
  const row = asRecord(value)
  return {
    id: str(row.id),
    reference: str(row.reference) || str(row.payment_reference) || str(row.id).slice(0, 8),
    name: str(row.name),
    category: refLabel(row.category),
    categoryId: refId(row.category) || str(row.category_id),
    amount: num(row.amount),
    date: str(row.date),
    note: str(row.note),
    status: str(row.status).toUpperCase(),
    owner: refLabel(row.added_by) || refLabel(row.initiated_by_name) || str(row.initiated_by_name),
    approvedBy: str(row.approved_by_name),
    rejectedBy: str(row.rejected_by_name),
    rejectionReason: str(row.rejection_reason),
    canApprove: canCurrentUserApprove(row.can_current_user_approve),
    createdAt: str(row.created_at),
  }
}

const mapBudget = (value: unknown): Budget => {
  const row = asRecord(value)
  // total_budget_amount / monthly_allocated_amount are the real figures; the *_formatted siblings aren't.
  return { id: str(row.id), categoryName: str(row.category_name), year: num(row.year), total: num(row.total_budget_amount), months: num(row.duration_months), monthly: num(row.monthly_allocated_amount) }
}

const mapCategorySpend = (value: unknown): CategorySpend => {
  const row = asRecord(value)
  return { id: str(row.category_id) || str(row.id), name: str(row.category_name) || str(row.name), spent: num(row.spent), count: num(row.transaction_count), budget: num(asRecord(row.budget).total_budget_amount) || num(row.budget) }
}

const mapTransfer = (value: unknown): ExpenseTransfer => {
  const row = asRecord(value)
  return {
    id: str(row.id),
    reference: str(row.payment_reference) || str(row.id).slice(0, 8),
    amount: num(row.amount),
    charges: num(row.charges),
    category: str(row.category_name),
    beneficiaryName: str(row.beneficiary_account_name),
    beneficiaryAccount: str(row.beneficiary_account_number),
    beneficiaryBank: str(row.beneficiary_bank_name),
    narration: str(row.narration),
    status: str(row.status).toUpperCase(),
    initiatedBy: str(row.initiated_by),
    initiatedByName: str(row.initiated_by_name),
    approvedByName: str(row.approved_by_name),
    rejectionReason: str(row.rejection_reason),
    canApprove: canCurrentUserApprove(row.can_current_user_approve),
    createdAt: str(row.created_at),
  }
}

const mapSettings = (value: unknown): ExpenseSettings => {
  const root = asRecord(value)
  const row = asRecord(root.data ?? root)
  return { maxPerTransaction: str(row.max_amount_per_transaction), dailyTransferLimit: str(row.daily_transfer_limit), dailyTransactionLimit: num(row.daily_transaction_limit), requireApprovalForAll: row.require_approval_for_all === true }
}

// ─── Mock (VITE_AUTH_MODE=mock only): the design's sample rows ──────────────

const mockExpense = (id: string, name: string, category: string, owner: string, amount: number, status: string, days: number, canApprove = false): Expense => {
  const date = new Date(Date.now() - days * 86_400_000)
  return { id, reference: id, name, category, categoryId: `cat-${category.toLowerCase()}`, amount, date: date.toISOString().slice(0, 10), note: '', status, owner, approvedBy: status === 'APPROVED' ? 'Tobi Olosunde' : '', rejectedBy: '', rejectionReason: '', canApprove, createdAt: date.toISOString() }
}

const mock = {
  expenses: [
    mockExpense('EXP-2041', 'Delta Air Lines', 'Travel', 'Maya Chen', 126000, 'PENDING_APPROVAL', 0, true),
    mockExpense('EXP-2040', 'AWS', 'Software', 'David Cole', 84240, 'APPROVED', 1),
    mockExpense('EXP-2039', 'WeWork', 'Operations', 'Tobi Olosunde', 320000, 'APPROVED', 2),
    mockExpense('EXP-2038', 'Notion Labs', 'Software', 'Maya Chen', 18000, 'APPROVED', 2),
    mockExpense('EXP-2037', 'Q3 campaign production', 'Marketing', 'David Cole', 680000, 'PENDING_APPROVAL', 0, true),
    mockExpense('EXP-2035', 'Duplicate courier claim', 'Operations', 'David Cole', 42000, 'REJECTED', 6),
  ] as Expense[],
  transfers: [
    { id: 'PAY-4821', reference: 'PAY-4821', amount: 680000, charges: 100, category: 'Operations', beneficiaryName: 'Atlas Print Co.', beneficiaryAccount: '1028834012', beneficiaryBank: 'Zenith Bank', narration: 'Print production', status: 'PENDING_APPROVAL', initiatedBy: 'u2', initiatedByName: 'David Cole', approvedByName: '', rejectionReason: '', canApprove: true, createdAt: new Date(Date.now() - 3_600_000).toISOString() },
    { id: 'PAY-4790', reference: 'PAY-4790', amount: 144000, charges: 50, category: 'Software', beneficiaryName: 'Figma Inc', beneficiaryAccount: '2034567810', beneficiaryBank: 'Access Bank', narration: 'Annual plan', status: 'SUCCESS', initiatedBy: 'u3', initiatedByName: 'Maya Chen', approvedByName: 'Tobi Olosunde', rejectionReason: '', canApprove: false, createdAt: new Date(Date.now() - 86_400_000).toISOString() },
  ] as ExpenseTransfer[],
  budgets: [
    { id: 'bud-1', categoryName: 'Operations', year: new Date().getFullYear(), total: 2_800_000, months: 12, monthly: 233333 },
    { id: 'bud-2', categoryName: 'Travel', year: new Date().getFullYear(), total: 1_920_000, months: 12, monthly: 160000 },
    { id: 'bud-3', categoryName: 'Software', year: new Date().getFullYear(), total: 1_860_000, months: 12, monthly: 155000 },
    { id: 'bud-4', categoryName: 'Marketing', year: new Date().getFullYear(), total: 1_920_000, months: 12, monthly: 160000 },
  ] as Budget[],
  settings: { maxPerTransaction: '500000.00', dailyTransferLimit: '2000000.00', dailyTransactionLimit: 25, requireApprovalForAll: true } as ExpenseSettings,
}

const mockCategorySpend = (): CategorySpend[] => {
  const byName = new Map<string, CategorySpend>()
  for (const name of ['Operations', 'Travel', 'Software', 'Marketing']) byName.set(name, { id: `cat-${name.toLowerCase()}`, name, spent: 0, count: 0, budget: mock.budgets.find(budget => budget.categoryName === name)?.total ?? 0 })
  for (const row of mock.expenses) {
    const entry = byName.get(row.category)
    if (entry && row.status !== 'REJECTED') { entry.spent += row.amount; entry.count += 1 }
  }
  return [...byName.values()]
}

// ─── Reads ──────────────────────────────────────────────────────────────────

const getExpenses = async (businessId: string, query: ExpenseQuery): Promise<ExpensesPageData> => {
  const limit = query.limit ?? EXPENSES_PAGE_SIZE
  if (!isLive()) {
    const term = query.search.toLowerCase()
    const rows = mock.expenses.filter(row => (!term || `${row.name} ${row.reference} ${row.owner}`.toLowerCase().includes(term)) && (!query.status || row.status === query.status) && (!query.category || row.categoryId === query.category || row.category === query.category) && (!query.startDate || row.date >= query.startDate) && (!query.endDate || row.date <= query.endDate))
    return mockDelay({ rows: rows.slice((query.page - 1) * limit, query.page * limit), total: rows.length, pages: Math.max(Math.ceil(rows.length / limit), 1), totalExpenses: mock.expenses.reduce((sum, row) => sum + row.amount, 0), summary: { spentThisMonth: 1_102_240, accountBalance: 42800, bankName: 'VFD Microfinance Bank', accountNumber: '0048928210' } })
  }
  const params = new URLSearchParams({ page: String(query.page), limit: String(limit) })
  if (query.search) params.set('search', query.search)
  if (query.category) params.set('category', query.category)
  if (query.status) params.set('status', query.status)
  if (query.startDate) params.set('start_date', query.startDate)
  if (query.endDate) params.set('end_date', query.endDate)
  const response = await apiRequest<unknown>(`expenses/business/${businessId}/?${params.toString()}`)
  const page = paginated(response, limit)
  const summary = asRecord(at(response, 'results.summary'))
  return {
    rows: page.rows.map(mapExpense),
    total: page.total,
    pages: page.pages,
    totalExpenses: num(at(response, 'results.total_expenses')),
    summary: { spentThisMonth: num(summary.spent_this_month), accountBalance: num(summary.account_balance), bankName: str(summary.bank_name), accountNumber: str(summary.account_number) },
  }
}

/** Search only once it is empty or 3+ characters, as sink does. */
const settledSearch = (search: string) => {
  const term = search.trim()
  return term.length === 0 || term.length >= 3 ? term : null
}

export const useExpenses = (query: ExpenseQuery) => {
  const { businessId } = useCurrentBusinessId()
  const search = settledSearch(query.search)
  const settled = { ...query, search: search ?? '' }
  return useQuery({
    queryKey: [...queryKeys.expenses, 'list', businessId, settled],
    queryFn: () => getExpenses(businessId as string, settled),
    enabled: (!isLive() || Boolean(businessId)) && search !== null,
    placeholderData: keepPreviousData,
  })
}

const getBudgets = async (businessId: string) => {
  if (!isLive()) return mockDelay([...mock.budgets])
  const response = await apiRequest<unknown>(`expenses/business/${businessId}/budgets/?limit=100`)
  return paginated(response, 100).rows.map(mapBudget)
}

export const useBudgets = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: [...queryKeys.expenses, 'budgets', businessId], queryFn: () => getBudgets(businessId as string), enabled: !isLive() || Boolean(businessId) })
}

const getCategorySpend = async (businessId: string) => {
  if (!isLive()) return mockDelay(mockCategorySpend())
  const response = await apiRequest<unknown>(`expenses/business/${businessId}/categories/?limit=200&year=${new Date().getFullYear()}`)
  return listFrom(response, ['data.data', 'data', 'results', 'results.data']).map(mapCategorySpend)
}

export const useCategorySpend = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: [...queryKeys.expenses, 'categories', businessId], queryFn: () => getCategorySpend(businessId as string), enabled: !isLive() || Boolean(businessId) })
}

/** Logged expenses and transfers together. Used for the status totals, read from the latest 100. */
const getExpenseTransactions = async (businessId: string) => {
  if (!isLive()) return mockDelay([...mock.expenses])
  const response = await apiRequest<unknown>(`expenses/business/${businessId}/transactions/?limit=100`)
  return paginated(response, 100).rows.map(mapExpense)
}

export const useExpenseTransactions = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: [...queryKeys.expenses, 'transactions', businessId], queryFn: () => getExpenseTransactions(businessId as string), enabled: !isLive() || Boolean(businessId) })
}

const getRecentActivity = async (businessId: string): Promise<ActivityRow[]> => {
  if (!isLive()) return mockDelay(mock.expenses.slice(0, 6).map(row => ({ id: row.id, name: row.name, category: row.category, by: row.owner, amount: row.amount, status: row.status, createdAt: row.createdAt })))
  const response = await apiRequest<unknown>(`expenses/business/${businessId}/recent-activity/?limit=10`)
  return paginated(response, 10).rows.map(value => {
    const row = mapExpense(value)
    return { id: row.id, name: row.name, category: row.category, by: row.owner, amount: row.amount, status: row.status, createdAt: row.createdAt || row.date }
  })
}

export const useRecentExpenseActivity = (enabled = true) => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: [...queryKeys.expenses, 'activity', businessId], queryFn: () => getRecentActivity(businessId as string), enabled: enabled && (!isLive() || Boolean(businessId)) })
}

const getSpendByUser = async (businessId: string): Promise<UserSpend[]> => {
  if (!isLive()) return mockDelay([{ id: 'u1', name: 'David Cole', total: 806240 }, { id: 'u2', name: 'Tobi Olosunde', total: 320000 }, { id: 'u3', name: 'Maya Chen', total: 144000 }])
  const response = await apiRequest<unknown>(`expenses/business/${businessId}/spend-by-user/?limit=8`)
  return paginated(response, 8).rows.map(value => {
    const row = asRecord(value)
    return { id: str(row.user_id), name: str(row.user_name) || 'Unknown', total: num(row.total_spent) }
  })
}

export const useSpendByUser = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: [...queryKeys.expenses, 'spend-by-user', businessId], queryFn: () => getSpendByUser(businessId as string), enabled: !isLive() || Boolean(businessId) })
}

const getSettings = async (businessId: string) => {
  if (!isLive()) return mockDelay({ ...mock.settings })
  return mapSettings(await apiRequest<unknown>(`expenses/settings/${businessId}/`))
}

export const useExpenseSettings = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: [...queryKeys.expenses, 'settings', businessId], queryFn: () => getSettings(businessId as string), enabled: !isLive() || Boolean(businessId) })
}

// ─── Transfers ──────────────────────────────────────────────────────────────

export type TransferQuery = { page: number; status: string; search: string; limit?: number }

const getTransfers = async (businessId: string, query: TransferQuery) => {
  const limit = query.limit ?? EXPENSES_PAGE_SIZE
  if (!isLive()) {
    const rows = mock.transfers.filter(row => !query.status || row.status === query.status)
    return mockDelay({ rows, total: rows.length, pages: 1 })
  }
  const params = new URLSearchParams({ page: String(query.page), limit: String(limit) })
  if (query.status) params.set('status', query.status)
  if (query.search) params.set('search', query.search)
  const response = await apiRequest<unknown>(`expenses/transfers/${businessId}/?${params.toString()}`)
  const page = paginated(response, limit)
  return { rows: page.rows.map(mapTransfer), total: page.total, pages: page.pages }
}

export const useExpenseTransfers = (query: TransferQuery, enabled = true) => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...queryKeys.expenseTransfers, 'list', businessId, query],
    queryFn: () => getTransfers(businessId as string, query),
    enabled: enabled && (!isLive() || Boolean(businessId)),
    placeholderData: keepPreviousData,
  })
}

/** Waiting items for the sidebar badge: one row each is enough, the envelope carries the total. */
export const usePendingApprovalCount = () => {
  const { canApprove, canTransfer } = useExpensePermissions()
  const relevant = canApprove || canTransfer
  const transfers = useExpenseTransfers({ page: 1, status: 'PENDING_APPROVAL', search: '', limit: 1 }, relevant)
  const expenses = useExpenses({ page: 1, search: '', category: '', status: 'PENDING_APPROVAL', startDate: '', endDate: '', limit: 1 })
  return (transfers.data?.total ?? 0) + (expenses.data?.total ?? 0)
}

// ─── Mutations ──────────────────────────────────────────────────────────────

const useInvalidateExpenses = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses })
    queryClient.invalidateQueries({ queryKey: queryKeys.expenseTransfers })
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
  }
}

const createExpense = async ({ businessId, input }: { businessId: string; input: ExpenseInput }) => {
  if (!isLive()) {
    mock.expenses = [{ ...mockExpense(`EXP-${2042 + mock.expenses.length}`, input.name, 'Operations', 'Tobi Olosunde', input.amount, 'PENDING_APPROVAL', 0), categoryId: input.categoryId, note: input.note ?? '', date: input.date }, ...mock.expenses]
    return mockDelay(null, 600)
  }
  return apiRequest<unknown>(`expenses/business/${businessId}/`, { method: 'POST', body: { name: input.name, category_id: input.categoryId, amount: input.amount, date: input.date, ...(input.note ? { note: input.note } : {}) } })
}

const updateExpense = async ({ id, input }: { id: string; input: ExpenseInput }) => {
  if (!isLive()) {
    mock.expenses = mock.expenses.map(row => (row.id === id ? { ...row, name: input.name, amount: input.amount, date: input.date, note: input.note ?? '', categoryId: input.categoryId } : row))
    return mockDelay(null, 500)
  }
  return apiRequest<unknown>(`expenses/${id}/`, { method: 'PATCH', body: { name: input.name, category_id: input.categoryId, amount: input.amount, date: input.date, ...(input.note ? { note: input.note } : {}) } })
}

const deleteExpense = async (id: string) => {
  if (!isLive()) {
    mock.expenses = mock.expenses.filter(row => row.id !== id)
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`expenses/${id}/`, { method: 'DELETE' })
}

const decideMock = <T extends { id: string; status: string }>(rows: T[], id: string, status: string) => rows.map(row => (row.id === id ? { ...row, status, canApprove: false } : row))

const approveExpense = async ({ id, pin }: { id: string; pin: string }) => {
  if (!isLive()) { mock.expenses = decideMock(mock.expenses, id, 'APPROVED'); return mockDelay(null, 600) }
  return apiRequest<unknown>(`expenses/${id}/approve/`, { method: 'POST', body: { pin } })
}

const rejectExpense = async ({ id, reason }: { id: string; reason: string }) => {
  if (!isLive()) { mock.expenses = decideMock(mock.expenses, id, 'REJECTED'); return mockDelay(null, 600) }
  return apiRequest<unknown>(`expenses/${id}/reject/`, { method: 'POST', body: { rejection_reason: reason } })
}

const approveTransfer = async ({ id, pin }: { id: string; pin: string }) => {
  if (!isLive()) { mock.transfers = decideMock(mock.transfers, id, 'SUCCESS'); return mockDelay(null, 600) }
  return apiRequest<unknown>(`expenses/transfers/${id}/approve/`, { method: 'POST', body: { pin } })
}

const rejectTransfer = async ({ id, reason }: { id: string; reason: string }) => {
  if (!isLive()) { mock.transfers = decideMock(mock.transfers, id, 'REJECTED'); return mockDelay(null, 600) }
  return apiRequest<unknown>(`expenses/transfers/${id}/reject/`, { method: 'POST', body: { rejection_reason: reason } })
}

export type InitiateTransferInput = { businessId: string; amount: number; accountNumber: string; bankCode: string; categoryId?: string; narration?: string; pin: string }

/** Answers with SUCCESS when it executed straight away, or a pending status when routed for approval. */
const initiateTransfer = async ({ businessId, amount, accountNumber, bankCode, categoryId, narration, pin }: InitiateTransferInput): Promise<{ status: string; reference: string }> => {
  if (!isLive()) {
    const reference = `PAY-${1000 + mock.transfers.length}`
    mock.transfers = [{ id: reference, reference, amount, charges: estimateExpenseCharges(amount), category: 'Operations', beneficiaryName: 'ATLAS PRINT CO', beneficiaryAccount: accountNumber, beneficiaryBank: 'Zenith Bank', narration: narration ?? '', status: 'PENDING_APPROVAL', initiatedBy: 'me', initiatedByName: 'Tobi Olosunde', approvedByName: '', rejectionReason: '', canApprove: false, createdAt: new Date().toISOString() }, ...mock.transfers]
    return mockDelay({ status: 'PENDING_APPROVAL', reference }, 800)
  }
  const response = await apiRequest<unknown>(`expenses/transfers/initiate/${businessId}/`, {
    method: 'POST',
    body: { business_id: businessId, amount: amount.toFixed(2), account_number: accountNumber, bank_code: bankCode, pin, ...(categoryId ? { category_id: categoryId } : {}), ...(narration ? { narration } : {}) },
  })
  return { status: str(at(response, 'data.status')).toUpperCase() || str(at(response, 'status')).toUpperCase(), reference: str(at(response, 'data.payment_reference')) }
}

const createBudget = async ({ businessId, input }: { businessId: string; input: BudgetInput }) => {
  if (!isLive()) {
    mock.budgets = [...mock.budgets, { id: `bud-${Date.now()}`, categoryName: input.categoryId.replace('cat-', ''), year: input.year, total: input.total, months: input.months, monthly: input.total / input.months }]
    return mockDelay(null, 500)
  }
  return apiRequest<unknown>(`expenses/business/${businessId}/budgets/`, { method: 'POST', body: { category_id: input.categoryId, year: input.year, total_budget_amount: input.total, duration_months: input.months } })
}

const editBudget = async ({ businessId, budgetId, input }: { businessId: string; budgetId: string; input: BudgetInput }) => {
  if (!isLive()) {
    mock.budgets = mock.budgets.map(row => (row.id === budgetId ? { ...row, year: input.year, total: input.total, months: input.months, monthly: input.total / input.months } : row))
    return mockDelay(null, 500)
  }
  return apiRequest<unknown>(`expenses/business/${businessId}/budgets/${budgetId}/`, { method: 'PATCH', body: { category_id: input.categoryId, year: input.year, total_budget_amount: input.total, duration_months: input.months } })
}

const deleteBudget = async ({ businessId, budgetId }: { businessId: string; budgetId: string }) => {
  if (!isLive()) {
    mock.budgets = mock.budgets.filter(row => row.id !== budgetId)
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`expenses/business/${businessId}/budgets/${budgetId}/`, { method: 'DELETE' })
}

const saveSettings = async ({ businessId, settings }: { businessId: string; settings: ExpenseSettings }) => {
  if (!isLive()) {
    mock.settings = settings
    return mockDelay(null, 500)
  }
  return apiRequest<unknown>(`expenses/settings/${businessId}/`, { method: 'PATCH', body: { max_amount_per_transaction: settings.maxPerTransaction, daily_transfer_limit: settings.dailyTransferLimit, daily_transaction_limit: settings.dailyTransactionLimit, require_approval_for_all: settings.requireApprovalForAll } })
}

const useExpenseMutation = <TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) => {
  const invalidate = useInvalidateExpenses()
  return useMutation({ mutationFn, onSuccess: invalidate })
}

export const useCreateExpense = () => useExpenseMutation(createExpense)
export const useUpdateExpense = () => useExpenseMutation(updateExpense)
export const useDeleteExpense = () => useExpenseMutation(deleteExpense)
export const useApproveExpense = () => useExpenseMutation(approveExpense)
export const useRejectExpense = () => useExpenseMutation(rejectExpense)
export const useApproveTransfer = () => useExpenseMutation(approveTransfer)
export const useRejectTransfer = () => useExpenseMutation(rejectTransfer)
export const useInitiateTransfer = () => useExpenseMutation(initiateTransfer)
export const useCreateBudget = () => useExpenseMutation(createBudget)
export const useEditBudget = () => useExpenseMutation(editBudget)
export const useDeleteBudget = () => useExpenseMutation(deleteBudget)
export const useSaveExpenseSettings = () => useExpenseMutation(saveSettings)
