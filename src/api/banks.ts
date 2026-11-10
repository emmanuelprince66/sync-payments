import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { requireBusinessId, updateBusiness, useCurrentBusiness, useCurrentBusinessId } from './business'
import { asRecord, at, isLive, listFrom, num, str } from './http'
import { queryClient } from '@/lib/query-client'
import { queryKeys } from './query-keys'

/**
 * Settlement bank accounts and online-payment settings — same endpoints as
 * sink-inventory's Settings › Bank and Online Payment screens:
 *
 *  GET    business/bank/{business_id}/      settlement accounts
 *  POST   business/bank/{business_id}/      { bank_name, account_name, account_number, min_fee?, max_fee?, percentage? }
 *  DELETE business/single_bank/{id}/
 *  GET    wallet/banks/                      bank list ({ bank_code | code, name })
 *  POST   wallet/beneficiary_enquiry/        { bank_code, account_number } → { data: { name } }
 *  PATCH  business/{id}/                     { allow_online_payment, pay_transaction_charges }
 */

export const bankKeys = {
  accounts: ['banks', 'accounts'] as const,
  list: ['banks', 'list'] as const,
}

export type SettlementAccount = {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  /** Transaction-charge rule, all three or none. */
  minFee: number | null
  maxFee: number | null
  percentage: number | null
}

export type BankOption = { code: string; name: string }

export type AddBankInput = {
  bankName: string
  accountNumber: string
  accountName: string
  fees?: { minFee: number; maxFee: number; percentage: number }
}

export type OnlinePayments = {
  enabled: boolean
  /** Who absorbs the card/transfer charges. */
  chargesPaidBy: 'customer' | 'business'
  /** Online payments can only be switched on once the business has passed KYC. */
  kycVerified: boolean
}

const optionalNumber = (value: unknown) => (value === null || value === undefined || value === '' ? null : num(value))

const mapAccount = (value: unknown): SettlementAccount => {
  const record = asRecord(value)
  return {
    id: str(record.id),
    bankName: str(record.bank_name),
    accountNumber: str(record.account_number),
    accountName: str(record.account_name),
    minFee: optionalNumber(record.min_fee),
    maxFee: optionalNumber(record.max_fee),
    percentage: optionalNumber(record.percentage),
  }
}

// ─── Sample data (VITE_AUTH_MODE=mock) ──────────────────────────────────────

const MOCK_BANKS: BankOption[] = [
  { code: '000013', name: 'Guaranty Trust Bank' },
  { code: '000014', name: 'Access Bank' },
  { code: '000016', name: 'First Bank of Nigeria' },
  { code: '000017', name: 'Wema Bank' },
  { code: '000004', name: 'United Bank for Africa' },
  { code: '000015', name: 'Zenith Bank' },
  { code: '090267', name: 'Kuda Microfinance Bank' },
  { code: '100004', name: 'Opay' },
  { code: '100033', name: 'PalmPay' },
]

const mock = {
  accounts: [{ id: 'bank-1', bankName: 'Guaranty Trust Bank', accountNumber: '0188454812', accountName: 'NORTHSTAR COMMERCE LTD', minFee: null, maxFee: null, percentage: null }] as SettlementAccount[],
  payments: { enabled: true, chargesPaidBy: 'customer', kycVerified: false } as OnlinePayments,
}

// ─── Services ───────────────────────────────────────────────────────────────

export const getAccounts = async (businessId: string | null) => {
  if (!isLive()) return mockDelay([...mock.accounts])
  const response = await apiRequest<unknown>(`business/bank/${businessId}/`)
  return listFrom(response, ['results', 'data', 'results.data']).map(mapAccount)
}

export const getBankList = async (): Promise<BankOption[]> => {
  if (!isLive()) return mockDelay(MOCK_BANKS)
  const response = await apiRequest<unknown>('wallet/banks/')
  return listFrom(response, ['data', 'results'])
    .map(value => {
      const bank = asRecord(value)
      return { code: str(bank.bank_code) || str(bank.code) || str(bank.bankCode), name: str(bank.name) || str(bank.bank_name) }
    })
    .filter(bank => bank.code && bank.name)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Looks up the registered account name for a bank code + 10-digit account number. */
const resolveAccountName = async ({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }) => {
  if (!isLive()) return mockDelay('NORTHSTAR COMMERCE LTD', 600)
  const response = await apiRequest<unknown>('wallet/beneficiary_enquiry/', { method: 'POST', body: { bank_code: bankCode, account_number: accountNumber } })
  const name = str(at(response, 'data.name')) || str(at(response, 'name'))
  if (!name) throw new Error('We could not verify this account number')
  return name
}

const addAccount = async ({ bankName, accountNumber, accountName, fees }: AddBankInput) => {
  if (!isLive()) {
    const account: SettlementAccount = { id: `bank-${Date.now()}`, bankName, accountNumber, accountName, minFee: fees?.minFee ?? null, maxFee: fees?.maxFee ?? null, percentage: fees?.percentage ?? null }
    mock.accounts = [...mock.accounts, account]
    return mockDelay(account, 600)
  }
  return apiRequest<unknown>(`business/bank/${requireBusinessId()}/`, {
    method: 'POST',
    body: {
      bank_name: bankName,
      account_name: accountName,
      // The backend schema types this as a number.
      account_number: Number(accountNumber),
      ...(fees ? { min_fee: fees.minFee, max_fee: fees.maxFee, percentage: fees.percentage } : {}),
    },
  })
}

const deleteAccount = async (id: string) => {
  if (!isLive()) {
    mock.accounts = mock.accounts.filter(account => account.id !== id)
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`business/single_bank/${id}/`, { method: 'DELETE' })
}

const saveOnlinePayments = async ({ enabled, chargesPaidBy }: Omit<OnlinePayments, 'kycVerified'>) => {
  if (!isLive()) {
    mock.payments = { ...mock.payments, enabled, chargesPaidBy }
    return mockDelay(null, 500)
  }
  return updateBusiness({ allow_online_payment: enabled, pay_transaction_charges: chargesPaidBy === 'business' })
}

/** Cached readers for other services (wallet): same keys as the hooks below, so no duplicate requests. */
export const fetchSettlementAccounts = (businessId: string) =>
  queryClient.fetchQuery({ queryKey: [...bankKeys.accounts, businessId], queryFn: () => getAccounts(businessId), staleTime: 5 * 60 * 1000 })
export const fetchBankList = () => queryClient.fetchQuery({ queryKey: bankKeys.list, queryFn: getBankList, staleTime: 60 * 60 * 1000 })

// ─── Hooks ──────────────────────────────────────────────────────────────────

export const useSettlementAccounts = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...bankKeys.accounts, isLive() ? businessId : 'mock'],
    queryFn: () => getAccounts(businessId),
    enabled: !isLive() || Boolean(businessId),
  })
}

export const useBankList = () => useQuery({ queryKey: bankKeys.list, queryFn: getBankList, staleTime: 60 * 60 * 1000 })

export const useResolveAccountName = () => useMutation({ mutationFn: resolveAccountName })

const useInvalidateBanks = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: bankKeys.accounts })
    queryClient.invalidateQueries({ queryKey: queryKeys.business })
  }
}

export const useAddSettlementAccount = () => {
  const invalidate = useInvalidateBanks()
  return useMutation({ mutationFn: addAccount, onSuccess: invalidate })
}

export const useDeleteSettlementAccount = () => {
  const invalidate = useInvalidateBanks()
  return useMutation({ mutationFn: deleteAccount, onSuccess: invalidate })
}

/** Online payments toggle + who pays the charges, read from the business record. */
export const useOnlinePayments = () => {
  const business = useCurrentBusiness()
  const mockQuery = useQuery({ queryKey: ['banks', 'online-payments', 'mock'], queryFn: () => mockDelay({ ...mock.payments }), enabled: !isLive() })
  if (!isLive()) return { data: mockQuery.data, isLoading: mockQuery.isLoading }
  const raw = business.data?.raw
  const data: OnlinePayments | undefined = raw
    ? { enabled: raw.allow_online_payment === true, chargesPaidBy: raw.pay_transaction_charges === true ? 'business' : 'customer', kycVerified: raw.kyc === true }
    : undefined
  return { data, isLoading: business.isLoading }
}

export const useSaveOnlinePayments = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveOnlinePayments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business })
      queryClient.invalidateQueries({ queryKey: ['banks', 'online-payments'] })
    },
  })
}
