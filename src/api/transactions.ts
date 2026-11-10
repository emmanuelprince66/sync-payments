import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { isoDay } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import { useSelectedBankStore } from '@/stores/selected-bank-store'
import { fetchBankList } from './banks'
import { useCurrentBusiness, useCurrentBusinessId, type BusinessBank } from './business'
import { asRecord, at, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { walletSummaryOptions } from './wallet'

/**
 * Wallet & transactions: a port of sink-inventory's Transactions data (same as sync-shipping).
 *  GET  wallet/{bank_id}/?page&limit&search&type&mode&start_date&end_date
 *       → { results: { wallet_details, inflow, outflow, transactions }, pages, total }
 *  GET  wallet/banks/                                   transfer bank list
 *  POST wallet/beneficiary_enquiry/  { bank_code, account_number } → { data: { name, ref } }
 *  GET  wallet/recent_beneficiaries/{bank_id}/?limit    accounts paid before
 *  GET  category/business/{business_id}/?type=EXPENSES  transfer categories
 *  POST wallet/transfer/{bank_id}/   { pin, ref, amount, narration, category }
 *  POST wallet/create_sub_account/{business_id}/ { previous_account, branch, is_expenses? }
 */

export const TRANSACTIONS_PAGE_SIZE = 20

/** sink's transfer fee: 10 up to 5,000, 25 up to 50,000, 50 above. */
export const transferCharge = (amount: number | string) => {
  const value = Number(amount)
  if (!amount || !value) return 0
  if (value <= 5000) return 10
  if (value <= 50000) return 25
  return 50
}

// ─── Permissions (sink: user-store `can`, owners can do everything) ─────────

export type WalletPermission = 'manage_bank_details' | 'can_initiate_expense_transfer' | 'view_transactions'

export const useCan = (permission: WalletPermission) =>
  useAuthStore(state => state.user?.role === 'OWNER' || !state.user?.role || state.user?.permissions?.[permission] === true)

export const useIsOwner = () => useAuthStore(state => state.user?.role === 'OWNER' || !state.user?.role)

// ─── Bank accounts (sink: useBusinessBanks) ─────────────────────────────────

export type PaymentBank = BusinessBank & { isExpenses: boolean }

const MOCK_BANKS: PaymentBank[] = [
  { id: 'mock-bank', bank_name: 'VFD Microfinance Bank', account_number: '0048921067', account_name: 'General operating', is_sub: false, isExpenses: false },
  { id: 'mock-bank-expense', bank_name: 'VFD Microfinance Bank', account_number: '0048928210', account_name: 'Expense account', is_sub: true, isExpenses: true },
  { id: 'mock-bank-payroll', bank_name: 'VFD Microfinance Bank', account_number: '0048921098', account_name: 'Payroll account', is_sub: true, isExpenses: false },
  { id: 'mock-bank-tax', bank_name: 'VFD Microfinance Bank', account_number: '0048924402', account_name: 'Tax reserve', is_sub: true, isExpenses: false },
]

const MOCK_BALANCES: Record<string, number> = { 'mock-bank': 184620.42, 'mock-bank-expense': 42800, 'mock-bank-payroll': 86240, 'mock-bank-tax': 28900 }

/**
 * The business's bank accounts and which one the wallet screens read. Primary is
 * the account with is_sub !== true. Only owners switch accounts; everyone else is
 * pinned to the primary, and a stored id that no longer exists is reset.
 */
export const useBusinessBanks = () => {
  const isOwner = useIsOwner()
  const { data: business, isLoading } = useCurrentBusiness()
  const selectedBankId = useSelectedBankStore(state => state.selectedBankId)
  const setSelectedBankId = useSelectedBankStore(state => state.setSelectedBankId)

  const banks = useMemo<PaymentBank[]>(() => {
    if (!isLive()) return MOCK_BANKS
    const raw = listFrom(business?.raw.banks, [])
    return (business?.banks ?? []).map((bank, index) => ({ ...bank, isExpenses: asRecord(raw[index]).is_expenses === true }))
  }, [business])
  const primaryBank = useMemo(() => banks.find(bank => bank.is_sub !== true) ?? banks[0] ?? null, [banks])
  const selectedBank = useMemo(() => (isOwner ? banks.find(bank => bank.id === selectedBankId) ?? primaryBank : primaryBank), [banks, selectedBankId, primaryBank, isOwner])

  useEffect(() => {
    if (!isOwner || !banks.length) return
    if (!banks.some(bank => bank.id === selectedBankId) && primaryBank?.id) setSelectedBankId(primaryBank.id)
  }, [banks, selectedBankId, primaryBank, setSelectedBankId, isOwner])

  return {
    banks,
    primaryBank,
    selectedBank,
    selectedBankId: selectedBank?.id ?? null,
    setSelectedBankId,
    canSwitchBanks: isOwner && banks.length > 1,
    isPrimary: (bank: BusinessBank) => bank.id === primaryBank?.id,
    /** sink: `!businessData?.kyc` opens the "Complete your KYC verification" prompt. */
    needsKyc: isLive() ? Boolean(business) && !business?.raw.kyc : false,
    businessId: isLive() ? business?.id ?? null : 'mock-business',
    storeUrl: business?.storeUrl ?? '',
    loading: isLive() && isLoading,
  }
}

// ─── Wallet page (balance + transactions) ───────────────────────────────────

export type TransactionFilter = 'ALL' | 'CREDIT' | 'DEBIT' | 'ONLINE'
export type TransactionQuery = { page: number; search: string; filter: TransactionFilter; startDate: string; endDate: string; limit?: number }

export type WalletTrx = {
  id: string
  accountName: string
  accountNumber: string
  bankName: string
  type: 'CREDIT' | 'DEBIT'
  channel: string
  isBnpl: boolean
  bnplReference: string
  amount: number
  charges: number
  description: string
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string
  createdAt: string
  reference: string
}

export type WalletAccountPage = {
  wallet: { balance: number; accountName: string; accountNumber: string; bankName: string } | null
  inflow: number
  outflow: number
  transactions: WalletTrx[]
  pages: number
  total: number
}

const mapTrx = (value: unknown, index: number): WalletTrx => {
  const trx = asRecord(value)
  return {
    id: str(trx.id) || `trx-${index}`,
    accountName: str(trx.account_name),
    accountNumber: str(trx.account_number),
    bankName: str(trx.bank_name),
    type: str(trx.type).toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT',
    channel: str(trx.mode) || str(trx.source) || '-',
    isBnpl: trx.is_bnpl === true,
    bnplReference: str(asRecord(trx.bnpl_details).order_reference),
    amount: num(trx.amount),
    charges: num(trx.charges),
    description: str(trx.description) || str(trx.narration),
    status: str(trx.status).toUpperCase() || 'PENDING',
    createdAt: str(trx.created_at),
    // sink's extractTransactionId: the provider's reference when there is one.
    reference: str(trx.transaction_id) || str(trx.reference) || str(trx.session_id) || str(trx.id),
  }
}

const walletDetails = (response: unknown): WalletAccountPage['wallet'] => {
  const details = asRecord(at(response, 'results.wallet_details'))
  return Object.keys(details).length ? { balance: num(details.balance), accountName: str(details.account_name), accountNumber: str(details.account_number), bankName: str(details.bank_name) } : null
}

const getWalletPage = async (bankId: string, query: TransactionQuery): Promise<WalletAccountPage> => {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit ?? TRANSACTIONS_PAGE_SIZE) })
  if (query.search) params.set('search', query.search)
  if (query.filter === 'CREDIT' || query.filter === 'DEBIT') params.set('type', query.filter)
  if (query.filter === 'ONLINE') params.set('mode', 'ONLINE')
  if (query.startDate) params.set('start_date', query.startDate)
  if (query.endDate) params.set('end_date', query.endDate)
  const response = await apiRequest<unknown>(`wallet/${bankId}/?${params.toString()}`)
  return {
    wallet: walletDetails(response),
    inflow: num(at(response, 'results.inflow')),
    outflow: num(at(response, 'results.outflow')),
    transactions: listFrom(response, ['results.transactions', 'data.results.transactions']).map(mapTrx),
    pages: Math.max(num(at(response, 'pages')) || num(at(response, 'results.pages')) || 1, 1),
    total: num(at(response, 'total')),
  }
}

/** sink only searches once the term is empty or at least 3 characters. */
const effectiveSearch = (search: string) => (search.length === 0 || search.length >= 3 ? search : null)

/** One wallet page. Pass `bankId` to read another account than the selected one. */
export const useWalletAccount = (query: TransactionQuery, bankId?: string | null) => {
  const { selectedBankId } = useBusinessBanks()
  const id = bankId ?? selectedBankId
  const search = effectiveSearch(query.search.trim())
  const settled = { ...query, search: search ?? '' }
  return useQuery({
    queryKey: [...queryKeys.wallet, 'account', isLive() ? id : 'mock', settled],
    queryFn: () => (isLive() ? getWalletPage(id as string, settled) : getMockWalletPage(settled, id)),
    enabled: (!isLive() || Boolean(id)) && search !== null,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}

/** Balance per account (limit=1 per bank, shared with the KYC status read). */
export const useWalletBalances = (banks: PaymentBank[]) => {
  const results = useQueries({
    queries: banks.map(bank => (isLive()
      ? { ...walletSummaryOptions(bank.id), select: (response: unknown): number => walletDetails(response)?.balance ?? 0 }
      : { queryKey: [...queryKeys.wallet, 'summary', 'mock', bank.id], queryFn: () => mockDelay<unknown>(MOCK_BALANCES[bank.id] ?? 0), select: (value: unknown): number => Number(value), staleTime: 60 * 1000 })),
  })
  const balances: Record<string, number> = {}
  banks.forEach((bank, index) => { balances[bank.id] = Number(results[index]?.data ?? 0) })
  return {
    balances,
    total: Object.values(balances).reduce((sum, value) => sum + value, 0),
    loading: results.some(result => result.isLoading),
    updatedAt: Math.max(0, ...results.map(result => result.dataUpdatedAt)),
  }
}

/** Everything wallet-related, for the "Sync banks" action. */
export const useRefreshWallet = () => {
  const queryClient = useQueryClient()
  return () => Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.wallet }), queryClient.invalidateQueries({ queryKey: queryKeys.business })])
}

// ─── Transfer ───────────────────────────────────────────────────────────────

export type TransferBank = { code: string; name: string }
export type Beneficiary = { name: string; ref: string }
export type RecentBeneficiary = { accountName: string; accountNumber: string; bankName: string; bankCode: string | null; bankLogo: string | null }
export type ExpenseCategory = { id: string; name: string }

export const useTransferBanks = (enabled = true) =>
  useQuery({ queryKey: [...queryKeys.wallet, 'banks'], queryFn: fetchBankList, enabled, staleTime: 60 * 60 * 1000 })

const enquire = async ({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }): Promise<Beneficiary> => {
  if (!isLive()) return mockDelay({ name: 'ATLAS PRINT CO', ref: 'mock-ref' }, 600)
  const response = await apiRequest<unknown>('wallet/beneficiary_enquiry/', { method: 'POST', body: { bank_code: bankCode, account_number: accountNumber } })
  const name = str(at(response, 'data.name')) || str(at(response, 'name'))
  if (!name) throw new Error('We could not verify this account. Check the bank and account number.')
  return { name, ref: str(at(response, 'data.ref')) || str(at(response, 'ref')) }
}

/** sink runs the enquiry automatically once a bank is picked and the number has 10 digits. */
export const useBeneficiaryEnquiry = (bankCode: string, accountNumber: string) =>
  useQuery({
    queryKey: [...queryKeys.wallet, 'beneficiary', bankCode, accountNumber],
    queryFn: () => enquire({ bankCode, accountNumber }),
    enabled: Boolean(bankCode) && accountNumber.length === 10,
    retry: false,
    staleTime: 10 * 60 * 1000,
  })

const MOCK_BENEFICIARIES: RecentBeneficiary[] = [
  { accountName: 'Atlas Print Co.', accountNumber: '1028834012', bankName: 'Zenith Bank', bankCode: '000015', bankLogo: null },
  { accountName: 'Northern Logistics', accountNumber: '2034562281', bankName: 'Access Bank', bankCode: '000014', bankLogo: null },
  { accountName: 'Kite Studio', accountNumber: '0099887740', bankName: 'Guaranty Trust Bank', bankCode: '000013', bankLogo: null },
  { accountName: 'Westlake Foods', accountNumber: '1188228824', bankName: 'Zenith Bank', bankCode: '000015', bankLogo: null },
]

const getRecentBeneficiaries = async (bankId: string, limit: number): Promise<RecentBeneficiary[]> => {
  if (!isLive()) return mockDelay(MOCK_BENEFICIARIES)
  const response = await apiRequest<unknown>(`wallet/recent_beneficiaries/${bankId}/?limit=${limit}`)
  return listFrom(response, ['data', 'results', 'data.results']).map(value => {
    const row = asRecord(value)
    return { accountName: str(row.account_name), accountNumber: str(row.account_number), bankName: str(row.bank_name), bankCode: str(row.bank_code) || null, bankLogo: str(row.bank_logo) || null }
  }).filter(row => row.accountNumber)
}

export const useRecentBeneficiaries = (bankId: string | null, limit = 6) =>
  useQuery({ queryKey: [...queryKeys.wallet, 'recent-beneficiaries', bankId, limit], queryFn: () => getRecentBeneficiaries(bankId as string, limit), enabled: Boolean(bankId) || !isLive(), staleTime: 5 * 60 * 1000 })

const MOCK_CATEGORIES: ExpenseCategory[] = [{ id: 'cat-ops', name: 'Operations' }, { id: 'cat-travel', name: 'Travel' }, { id: 'cat-software', name: 'Software' }, { id: 'cat-marketing', name: 'Marketing' }]

const getExpenseCategories = async (businessId: string): Promise<ExpenseCategory[]> => {
  if (!isLive()) return mockDelay([...MOCK_CATEGORIES])
  const response = await apiRequest<unknown>(`category/business/${businessId}/?type=EXPENSES`)
  return listFrom(response, ['data', 'results', 'data.results']).map(value => ({ id: str(asRecord(value).id), name: str(asRecord(value).name) })).filter(category => category.id)
}

export const useExpenseCategories = (enabled = true) => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ queryKey: ['categories', 'EXPENSES', businessId], queryFn: () => getExpenseCategories(businessId as string), enabled: enabled && (Boolean(businessId) || !isLive()), staleTime: 5 * 60 * 1000 })
}

const createCategory = async ({ businessId, name }: { businessId: string; name: string }) => {
  if (!isLive()) {
    MOCK_CATEGORIES.push({ id: `cat-${Date.now()}`, name })
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`category/business/${businessId}/`, { method: 'POST', body: { name, type: 'EXPENSES' } })
}

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'EXPENSES'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses })
    },
  })
}

export type TransferInput = { bankId: string; pin: string; ref: string; amount: string; narration: string; categoryId?: string }

const transfer = async ({ bankId, pin, ref, amount, narration, categoryId }: TransferInput) => {
  if (!isLive()) return mockDelay({ transaction_id: `TRF${Date.now()}` }, 900)
  return apiRequest<unknown>(`wallet/transfer/${bankId}/`, { method: 'POST', body: { pin, ref, amount, narration, category: categoryId } })
}

export const useTransfer = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: transfer, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet }) })
}

/** Pulls the transaction id out of a transfer response (sink: extractTransactionId). */
export const extractTransactionId = (response: unknown) =>
  str(at(response, 'data.transaction_id')) || str(at(response, 'transaction_id')) || str(at(response, 'data.reference')) || str(at(response, 'reference')) || str(at(response, 'data.id')) || ''

// ─── Sub-account ────────────────────────────────────────────────────────────

const createSubAccount = async ({ businessId, previousAccount, branch, isExpenses }: { businessId: string; previousAccount: string; branch: string; isExpenses?: boolean }) => {
  if (!isLive()) return mockDelay(null, 700)
  return apiRequest<unknown>(`wallet/create_sub_account/${businessId}/`, { method: 'POST', body: { previous_account: previousAccount, branch, ...(isExpenses ? { is_expenses: true } : {}) } })
}

export const useCreateSubAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: createSubAccount, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.business }) })
}

// ─── Mock (VITE_AUTH_MODE=mock only): the design's sample rows ──────────────

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString()

const mockTrx = (id: string, accountName: string, bankName: string, type: WalletTrx['type'], channel: string, amount: number, description: string, status: string, hours: number, reference: string): WalletTrx => ({
  id, accountName, accountNumber: '0123456789', bankName, type, channel, isBnpl: false, bnplReference: '', amount, charges: type === 'DEBIT' ? 25 : 0, description, status, createdAt: hoursAgo(hours), reference,
})

const MOCK_TRX: WalletTrx[] = [
  mockTrx('TX-840291', 'Northstar Coffee', 'Guaranty Trust Bank', 'CREDIT', 'TERMINAL', 2840, 'Terminal 01', 'SUCCESS', 1, 'SYNC-724091'),
  mockTrx('TX-840290', 'Avery Stone', 'Zenith Bank', 'CREDIT', 'TRANSFER', 12500, 'Bank transfer', 'SUCCESS', 3, 'ACH-579320'),
  mockTrx('TX-840289', 'Fieldwork Studio', 'Access Bank', 'CREDIT', 'TERMINAL', 1760.5, 'Terminal 04', 'PENDING', 5, 'SYNC-724089'),
  mockTrx('TX-840288', 'Olive & Reed', 'Zenith Bank', 'CREDIT', 'ONLINE', 429.99, 'Copy payment', 'SUCCESS', 26, 'SYNC-724088'),
  mockTrx('TX-840287', 'Juniper Market', 'Wema Bank', 'DEBIT', 'TRANSFER', 5200, 'Payout', 'SUCCESS', 30, 'PAY-001829'),
  mockTrx('TX-840286', 'Common Ground LLC', 'Opay', 'CREDIT', 'TERMINAL', 980, 'Terminal 03', 'REVERSED', 32, 'SYNC-724086'),
  mockTrx('TX-840285', 'Kite Studio', 'Guaranty Trust Bank', 'DEBIT', 'TRANSFER', 9200, 'Design retainer', 'SUCCESS', 60, 'PAY-001828'),
  mockTrx('TX-840284', 'Delta Stores', 'United Bank for Africa', 'CREDIT', 'ONLINE', 18240, 'Store order', 'SUCCESS', 84, 'SYNC-724080'),
  mockTrx('TX-840283', 'Westlake Foods', 'Zenith Bank', 'DEBIT', 'TRANSFER', 12400, 'Supplies', 'SUCCESS', 110, 'PAY-001827'),
]

const getMockWalletPage = (query: TransactionQuery, bankId?: string | null): Promise<WalletAccountPage> => {
  const term = query.search.toLowerCase()
  const inRange = MOCK_TRX.filter(trx => {
    const day = isoDay(new Date(trx.createdAt))
    return (!query.startDate || day >= query.startDate) && (!query.endDate || day <= query.endDate)
  })
  const rows = inRange.filter(trx =>
    (query.filter === 'ALL' || (query.filter === 'ONLINE' ? trx.channel === 'ONLINE' : trx.type === query.filter)) &&
    (!term || [trx.accountName, trx.description, trx.id, trx.reference].some(value => value.toLowerCase().includes(term))))
  const sum = (type: WalletTrx['type']) => inRange.filter(trx => trx.type === type).reduce((total, trx) => total + trx.amount, 0)
  const limit = query.limit ?? TRANSACTIONS_PAGE_SIZE
  const bank = MOCK_BANKS.find(item => item.id === bankId) ?? MOCK_BANKS[0]
  return mockDelay({
    wallet: { balance: MOCK_BALANCES[bank.id] ?? 0, accountName: bank.account_name ?? '', accountNumber: bank.account_number ?? '', bankName: bank.bank_name ?? '' },
    inflow: sum('CREDIT'),
    outflow: sum('DEBIT'),
    transactions: rows.slice((query.page - 1) * limit, query.page * limit),
    pages: Math.max(Math.ceil(rows.length / limit), 1),
    total: rows.length,
  })
}
