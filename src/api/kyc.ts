import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest, mockDelay } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { useSelectedBankStore } from '@/stores/selected-bank-store'
import { requireBusinessId, useCurrentBusiness, useCurrentBusinessId, type BusinessBank } from './business'
import { apiFormRequest, asRecord, at, isLive, str, type UnknownRecord } from './http'
import { queryKeys } from './query-keys'
import { fetchWalletSummary } from './wallet'

/**
 * KYC — the same backend calls sink-inventory makes (app/api/kyc/** there):
 *
 *  POST wallet/create_bank_account/{business_id}/        opens the account: individual Tier 1, corporate Tier 1 (JSON)
 *  POST wallet/upgrade_account/{bank_id}/                individual Tier 2 / 3 — JSON { bvn?, nin?, address? }
 *  POST wallet/upgrade_corporate_account/{bank_id}/      corporate Tier 2 — multipart (tin, 7 documents, directors)
 *  GET  wallet/upgrade_corporate_account/{bank_id}/      what the company has filed + review status (404 → nothing filed)
 *  GET  wallet/{bank_id}/                                verification state: tier, nin, bvn, address, account_type, wallet_details
 *
 * The upgrade endpoints resolve an existing BankAccount from the path id and
 * 404 with "No BankAccount matches the given query" when handed a business, so
 * they are keyed on the selected bank (sink's selectedBankId); only
 * create_bank_account takes the business, because that is what opens one.
 */

export const kycKeys = {
  all: queryKeys.kyc,
  status: [...queryKeys.kyc, 'status'] as const,
  corporate: [...queryKeys.kyc, 'corporate'] as const,
}

export type AccountType = 'individual' | 'corporate'
export type IdentityMethod = 'nin' | 'bvn'

export type WalletDetails = { account_name: string; account_number: string; bank_name: string }

/** What the account has already verified, read from the wallet payload (sink's `verification`). */
export type KycStatus = {
  /** Bank id the upgrade endpoints are keyed on. Null until the business has an account. */
  bankId: string | null
  /** 0 until the account has been tiered. */
  tier: number
  tierLabel: string | null
  accountType: AccountType | null
  hasNin: boolean
  hasBvn: boolean
  hasAddress: boolean
  hasPin: boolean
  /** Null until an account has been opened. */
  wallet: WalletDetails | null
  completedTiers: number[]
  corporateCompletedTiers: number[]
  /** Null until the provider has reviewed a submission. */
  verificationStatus: string | null
  /** A wallet exists as soon as the first tier is accepted. */
  hasStarted: boolean
  /** The identifier Tier 2 still needs; null when both or neither are on file. */
  missingIdentity: IdentityMethod | null
  /** Business-level flag the online-payments toggle is gated on. */
  businessVerified: boolean
}

export type CorporateUpgradeDirector = { fullname: string | null; identification: string | null; passport: string | null }

/** sink's `corporateReview`: where the corporate documents stand with the reviewers. */
export type CorporateReview = {
  isPending: boolean
  isApproved: boolean
  isRejected: boolean
  hasSubmitted: boolean
  status: string | null
  submittedAt: string | null
  directors: CorporateUpgradeDirector[]
}

export type CreateAccountInput = UnknownRecord & { type: 'INDIVIDUAL' | 'CORPORATE' }
export type IndividualUpgradeBody = { bvn?: string; nin?: string; address?: string }

// ─── Errors ─────────────────────────────────────────────────────────────────

const WRAPPERS = ['details', 'payload', 'errors', 'data']
const isPlainObject = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * The first human-readable message in an error body (ported from sink's
 * lib/apiError.ts). The wallet endpoints answer either {"message": "..."} or a
 * DRF field dictionary like {"business_type": ["... required ..."]}; reading
 * only `message` hid which field the server rejected.
 */
export const firstApiError = (body: unknown, fallback: string, depth = 0): string => {
  if (typeof body === 'string') return body.trim() || fallback
  if (depth > 6 || !body) return fallback
  if (Array.isArray(body)) {
    for (const entry of body) {
      const found = firstApiError(entry, '', depth + 1)
      if (found) return found
    }
    return fallback
  }
  if (!isPlainObject(body)) return fallback
  for (const key of ['message', 'error', 'detail']) {
    const value = body[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  for (const key of WRAPPERS) {
    if (key in body) {
      const found = firstApiError(body[key], '', depth + 1)
      if (found) return found
    }
  }
  for (const [key, value] of Object.entries(body)) {
    if (['message', 'error', 'detail', 'status_code', ...WRAPPERS].includes(key)) continue
    const found = firstApiError(value, '', depth + 1)
    if (found) return found
  }
  return fallback
}

/** Message for a failed KYC call: the field-level server error when there is one. */
export const kycErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? firstApiError(error.data, error.message || fallback) : error instanceof Error && error.message ? error.message : fallback

// ─── Mapping ────────────────────────────────────────────────────────────────

/** "TIER 1" → 1. 0 when the account has not been tiered yet. */
const parseTierNumber = (tier: string | null) => {
  const match = /(\d+)/.exec(tier ?? '')
  return match ? Number(match[1]) : 0
}

export const buildKycStatus = (account: UnknownRecord, bankId: string | null, businessVerified: boolean): KycStatus => {
  const hasNin = Boolean(account.nin)
  const hasBvn = Boolean(account.bvn)
  const hasAddress = Boolean(account.address)

  const completedTiers: number[] = []
  if (hasNin || hasBvn) completedTiers.push(1)
  if (hasNin && hasBvn) completedTiers.push(2)
  if (hasNin && hasBvn && hasAddress) completedTiers.push(3)

  const walletRecord = isPlainObject(account.wallet_details) ? account.wallet_details : null
  const tierLabel = str(account.tier) || null
  const tier = parseTierNumber(tierLabel)
  // account_type is reported at the top level and again on the wallet; take whichever is present.
  const rawType = str(account.account_type) || str(walletRecord?.account_type)
  const accountType: AccountType | null = rawType === 'CORPORATE' ? 'corporate' : rawType === 'INDIVIDUAL' ? 'individual' : null

  // Only read the account's tier as corporate progress on a corporate account:
  // on an individual one that number describes the NIN/BVN ladder.
  const corporateCompletedTiers: number[] = []
  if (accountType === 'corporate') {
    if (tier >= 1) corporateCompletedTiers.push(1)
    if (tier >= 2) corporateCompletedTiers.push(2)
  }

  return {
    bankId,
    tier,
    tierLabel,
    accountType,
    hasNin,
    hasBvn,
    hasAddress,
    hasPin: Boolean(account.pin),
    wallet: walletRecord ? { account_name: str(walletRecord.account_name), account_number: str(walletRecord.account_number), bank_name: str(walletRecord.bank_name) } : null,
    completedTiers,
    corporateCompletedTiers,
    verificationStatus: str(account.verification_status) || null,
    hasStarted: Boolean(walletRecord) || completedTiers.length > 0,
    missingIdentity: hasNin === hasBvn ? null : hasNin ? 'bvn' : 'nin',
    businessVerified,
  }
}

const mapCorporateReview = (record: UnknownRecord | null): CorporateReview => {
  const status = str(record?.status).toUpperCase()
  const directors = Array.isArray(record?.directors) ? record.directors.map(entry => {
    const director = asRecord(entry)
    return { fullname: str(director.fullname) || null, identification: str(director.identification) || null, passport: str(director.passport) || null }
  }) : []
  return {
    isPending: status === 'PENDING',
    isApproved: status === 'APPROVED',
    isRejected: status === 'REJECTED',
    hasSubmitted: Boolean(record),
    status: status || null,
    submittedAt: str(record?.created_at) || null,
    directors,
  }
}

/** Individual accounts climb three tiers, corporate two. Drives every progress bar and "finish verification" prompt. */
export const kycProgress = (status: KycStatus | undefined) => {
  const maxTier = status?.accountType === 'corporate' ? 2 : 3
  const tier = Math.min(status?.tier ?? 0, maxTier)
  return { maxTier, percent: Math.round((tier / maxTier) * 100), complete: tier >= maxTier }
}

/**
 * sink's useBusinessBanks: the primary account is the one with is_sub !== true.
 * Only the owner may pick another account; everyone else reads the primary one.
 */
export const resolveKycBank = (banks: BusinessBank[], selectedBankId: string | null, isOwner: boolean) => {
  const primary = banks.find(bank => bank.is_sub !== true) ?? banks[0] ?? null
  if (!isOwner) return primary
  return banks.find(bank => bank.id === selectedBankId) ?? primary
}

// ─── Sample data (VITE_AUTH_MODE=mock) ──────────────────────────────────────

const mock: { account: UnknownRecord; corporate: UnknownRecord | null } = {
  // Part-way through, so sample mode shows the rail, the next tier and the corporate upgrade.
  account: { nin: 'on-file', tier: 'TIER 1', pin: true, account_type: 'INDIVIDUAL', wallet_details: { account_type: 'INDIVIDUAL', account_name: 'Sync360-General operating', account_number: '0048921067', bank_name: 'VFD Microfinance Bank' } },
  corporate: null,
}

// ─── Services ───────────────────────────────────────────────────────────────

const getStatus = async (bankId: string | null, businessVerified: boolean): Promise<KycStatus> => {
  if (!isLive()) return mockDelay(buildKycStatus(mock.account, mock.account.wallet_details ? 'mock-bank' : null, Boolean(mock.account.tier)))
  if (!bankId) return buildKycStatus({}, null, businessVerified)
  // Same cached GET wallet/{bank_id}/ the wallet screens use.
  const response = await fetchWalletSummary(bankId)
  return buildKycStatus(asRecord(asRecord(response).results), bankId, businessVerified)
}

const getCorporateReview = async (bankId: string): Promise<CorporateReview> => {
  if (!isLive()) return mockDelay(mapCorporateReview(mock.corporate))
  try {
    const response = await apiRequest<unknown>(`wallet/upgrade_corporate_account/${bankId}/`)
    const record = asRecord(at(response, 'data') ?? response)
    return mapCorporateReview(Object.keys(record).length ? record : null)
  } catch (error) {
    // A business that has never submitted has nothing to report: an empty state, not a failure.
    if (error instanceof ApiError && error.status === 404) return mapCorporateReview(null)
    throw error
  }
}

/** Opens the account. The response may carry the provider's hosted wallet page in `url`. */
const createAccount = async (body: CreateAccountInput): Promise<{ url: string | null }> => {
  if (!isLive()) {
    const identity = body.type === 'INDIVIDUAL' ? { nin: body.nin, bvn: body.bvn } : { bvn: body.bvn }
    mock.account = {
      ...mock.account,
      ...identity,
      tier: 'TIER 1',
      account_type: body.type,
      wallet_details: { account_type: body.type, account_name: `Sync360-${String(body.first_name ?? body.business_name ?? 'Merchant')}`, account_number: '1028459731', bank_name: 'VFD Microfinance Bank' },
    }
    return mockDelay({ url: null }, 700)
  }
  const response = await apiRequest<unknown>(`wallet/create_bank_account/${requireBusinessId()}/`, { method: 'POST', body })
  return { url: str(at(response, 'data.url')) || str(at(response, 'url')) || null }
}

const upgradeIndividual = async ({ bankId, body }: { bankId: string; body: IndividualUpgradeBody }) => {
  if (!isLive()) {
    mock.account = { ...mock.account, ...body }
    const next = buildKycStatus(mock.account, 'mock-bank', true)
    mock.account.tier = `TIER ${Math.max(...next.completedTiers, 1)}`
    return mockDelay(null, 700)
  }
  return apiRequest<unknown>(`wallet/upgrade_account/${bankId}/`, { method: 'POST', body })
}

const upgradeCorporate = async ({ bankId, body }: { bankId: string; body: FormData }) => {
  if (!isLive()) {
    mock.corporate = { status: 'PENDING', created_at: new Date().toISOString(), directors: body.getAll('directors').map(entry => JSON.parse(String(entry)) as UnknownRecord) }
    return mockDelay(null, 900)
  }
  // No Content-Type: the browser sets the multipart boundary from the FormData.
  return apiFormRequest<unknown>(`wallet/upgrade_corporate_account/${bankId}/`, 'POST', body)
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** The bank KYC reads and upgrades (sink's selectedBankId), plus the business-level verified flag. */
const useKycBank = () => {
  const business = useCurrentBusiness()
  const selectedBankId = useSelectedBankStore(state => state.selectedBankId)
  const role = useAuthStore(state => state.user?.role)
  const isOwner = !role || role === 'OWNER'
  const bank = resolveKycBank(business.data?.banks ?? [], selectedBankId, isOwner)
  return { bankId: bank?.id ?? null, businessVerified: business.data?.raw.kyc === true, businessLoading: business.isLoading }
}

/** Where the account stands: tier, identifiers on file, account type, wallet details. */
export const useKycStatus = () => {
  const { businessId } = useCurrentBusinessId()
  const { bankId, businessVerified, businessLoading } = useKycBank()
  return useQuery({
    queryKey: [...kycKeys.status, isLive() ? businessId : 'mock', bankId],
    queryFn: () => getStatus(bankId, businessVerified),
    enabled: !isLive() || (Boolean(businessId) && !businessLoading),
  })
}

/** What the company has already filed and where the review stands. Empty for an individual account. */
export const useCorporateReview = () => {
  const { bankId } = useKycBank()
  return useQuery({
    queryKey: [...kycKeys.corporate, isLive() ? bankId : 'mock'],
    queryFn: () => getCorporateReview(bankId as string),
    enabled: !isLive() || Boolean(bankId),
    retry: false,
  })
}

/** The bank id the upgrade endpoints take (sink passes `selectedBankId ?? ""`). */
export const useKycBankId = () => useKycBank().bankId

/** Re-reads the wallet payload (and the business, whose banks change once an account opens). */
export const useRefreshVerification = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: kycKeys.status })
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
    queryClient.invalidateQueries({ queryKey: queryKeys.business })
  }
}

export const useRefreshCorporateReview = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: kycKeys.corporate })
}

export const useCreateKycAccount = () => useMutation({ mutationFn: createAccount, retry: false })
export const useUpgradeIndividualAccount = () => useMutation({ mutationFn: upgradeIndividual, retry: false })
export const useUpgradeCorporateAccount = () => useMutation({ mutationFn: upgradeCorporate, retry: false })
