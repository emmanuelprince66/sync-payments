import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { isoDay } from '@/lib/format'
import { requireBusinessId } from './business'
import { asRecord, at, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { addMockBranch, getMockAddedBranches, getMockWallet } from './sample/branches'
import { useTerminals } from './terminals'
import { useBusinessBanks, useCreateSubAccount } from './transactions'

/**
 * Branches, the way sink-inventory models them: a branch is one of the business's
 * bank accounts (the main one has is_sub !== true; expense accounts aren't branches).
 *
 *  GET  business/{id}/                            banks (useBusinessBanks)
 *  GET  terminal/businesses/{id}/terminals/       matched on settlement_account_number (useTerminals)
 *  GET  wallet/{bank_id}/?page&limit&start_date&end_date   inflow, total, transactions, per account
 *  POST wallet/create_sub_account/{business_id}/  { previous_account, branch } (useCreateSubAccount)
 */

export type Branch = {
  id: string
  name: string
  accountNumber: string
  bankName: string
  isMain: boolean
  terminals: number
  todayVolume: number
  todayPayments: number
}

export type WalletRow = {
  id: string
  bankId: string
  counterparty: string
  type: 'CREDIT' | 'DEBIT'
  channel: string
  amount: number
  description: string
  status: 'Completed' | 'Pending' | 'Failed' | 'Reversed'
  createdAt: string
  reference: string
}

type WalletParams = { page: number; limit: number; startDate?: string; endDate?: string }

const STATUS_LABELS: Record<string, WalletRow['status']> = { SUCCESS: 'Completed', FAILED: 'Failed', REVERSED: 'Reversed' }

const channelLabel = (mode: string) => (mode === 'STORE' ? 'In store' : mode === 'OUTSTORE' ? 'Online' : mode || 'Transfer')

const mapRow = (bankId: string) => (value: unknown, index: number): WalletRow => {
  const row = asRecord(value)
  return {
    id: str(row.id) || `trx-${index}`,
    bankId,
    counterparty: str(row.account_name) || 'Unknown',
    type: str(row.type).toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT',
    channel: channelLabel(str(row.mode)),
    amount: num(row.amount),
    description: str(row.description),
    status: STATUS_LABELS[str(row.status).toUpperCase()] ?? 'Pending',
    createdAt: str(row.created_at),
    reference: str(row.transaction_id) || str(row.reference) || str(row.session_id) || str(row.id),
  }
}

const getLiveWallet = (bankId: string, { page, limit, startDate, endDate }: WalletParams) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)
  return apiRequest<unknown>(`wallet/${bankId}/?${params.toString()}`)
}

const getBranchWallet = async (bankId: string, params: WalletParams) => {
  const response = isLive() ? await getLiveWallet(bankId, params) : await getMockWallet(bankId, params)
  return {
    inflow: num(at(response, 'results.inflow')),
    rows: listFrom(response, ['results.transactions', 'data.results.transactions']).map(mapRow(bankId)),
    pages: Math.max(num(at(response, 'pages')) || num(at(response, 'results.pages')) || 1, 1),
    total: num(at(response, 'total')),
  }
}

const branchWalletQuery = (bankId: string, params: WalletParams) => ({
  queryKey: [...queryKeys.wallet, 'branch', bankId, params] as const,
  queryFn: () => getBranchWallet(bankId, params),
  staleTime: 60 * 1000,
})

/** The accounts that count as branches, main account first. */
const useBranchAccounts = () => {
  const { banks, isPrimary, loading } = useBusinessBanks()
  const added = useQuery({ queryKey: [...queryKeys.branches, 'mock-added'], queryFn: getMockAddedBranches, enabled: !isLive() })
  const accounts = [...banks.filter(bank => !bank.isExpenses), ...(added.data ?? [])].map(bank => ({
    id: bank.id,
    name: bank.account_name || `Account ${(bank.account_number ?? '').slice(-4)}`,
    accountNumber: bank.account_number ?? '',
    bankName: bank.bank_name ?? '',
    isMain: isPrimary(bank),
  }))
  return { accounts: accounts.sort((a, b) => Number(b.isMain) - Number(a.isMain)), isLoading: loading }
}

/** Every account with today's collections and the terminals that settle into it. */
export const useBranches = () => {
  const { accounts, isLoading } = useBranchAccounts()
  const terminals = useTerminals()
  const today = isoDay(new Date())
  const todays = useQueries({ queries: accounts.map(account => branchWalletQuery(account.id, { page: 1, limit: 1, startDate: today, endDate: today })) })
  const branches: Branch[] = accounts.map((account, index) => ({
    ...account,
    terminals: terminals.data?.filter(terminal => terminal.settlementAccount === account.accountNumber).length ?? 0,
    todayVolume: todays[index]?.data?.inflow ?? 0,
    todayPayments: todays[index]?.data?.total ?? 0,
  }))
  return { branches, isLoading: isLoading || todays.some(query => query.isLoading) }
}

/** One branch's transactions, or the newest from all of them merged when bankId is null. */
export const useBranchTransactions = (bankId: string | null, page: number, limit: number, startDate = '', endDate = '') => {
  const { accounts, isLoading } = useBranchAccounts()
  const targets = bankId ? accounts.filter(account => account.id === bankId) : accounts
  const results = useQueries({ queries: targets.map(account => ({ ...branchWalletQuery(account.id, { page, limit, startDate, endDate }), placeholderData: keepPreviousData })) })
  const rows = results
    .flatMap(result => result.data?.rows ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return {
    rows,
    pages: Math.max(1, ...results.map(result => result.data?.pages ?? 1)),
    isLoading: isLoading || results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
  }
}

export type CreateBranchInput = { previousAccount: string; branch: string }

export const useCreateBranch = () => {
  const queryClient = useQueryClient()
  const subAccount = useCreateSubAccount()
  return useMutation({
    mutationFn: ({ previousAccount, branch }: CreateBranchInput) => (isLive() ? subAccount.mutateAsync({ businessId: requireBusinessId(), previousAccount, branch }) : addMockBranch(branch)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.branches }),
  })
}
