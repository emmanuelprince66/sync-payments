import { useMutation } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { at, isLive, str } from './http'
import { queryKeys } from './query-keys'

/**
 * Wallet reads shared across screens, and the transaction PIN flows (sink's usePinHook).
 *  GET   wallet/{bank_id}/?page=1&limit=1              wallet_details, tier, nin, bvn, pin...
 *  POST  wallet/set_pin/{business_id}/                 { pin }
 *  POST  wallet/change_pin/{business_id}/              { old_pin, new_pin }
 *  GET   wallet/request_reset_pin_email/{business_id}/ emails a code
 *  POST  wallet/verify_pin_reset_code/{business_id}/   { token } → { data: { uid64 } }
 *  PATCH wallet/reset_pin/{business_id}/               { uid64, pin }
 */

/** limit=1: only the account block is wanted, as sink's useExpenseAccounts reads a balance. One cached request per bank. */
export const walletSummaryOptions = (bankId: string) => ({
  queryKey: [...queryKeys.wallet, 'summary', bankId] as const,
  queryFn: () => apiRequest<unknown>(`wallet/${bankId}/?page=1&limit=1`),
  staleTime: 60 * 1000,
})

export const fetchWalletSummary = (bankId: string) => queryClient.fetchQuery(walletSummaryOptions(bankId))

type PinInput = { businessId: string }

const setPin = ({ businessId, pin }: PinInput & { pin: string }) =>
  isLive() ? apiRequest<unknown>(`wallet/set_pin/${businessId}/`, { method: 'POST', body: { pin } }) : mockDelay(null, 500)

const changePin = ({ businessId, oldPin, newPin }: PinInput & { oldPin: string; newPin: string }) =>
  isLive() ? apiRequest<unknown>(`wallet/change_pin/${businessId}/`, { method: 'POST', body: { old_pin: oldPin, new_pin: newPin } }) : mockDelay(null, 500)

const requestPinReset = ({ businessId }: PinInput) =>
  isLive() ? apiRequest<unknown>(`wallet/request_reset_pin_email/${businessId}/`) : mockDelay(null, 500)

/** Resolves to the uid64 the reset call needs. */
const verifyPinReset = async ({ businessId, token }: PinInput & { token: string }) => {
  if (!isLive()) return mockDelay('mock-uid', 500)
  const response = await apiRequest<unknown>(`wallet/verify_pin_reset_code/${businessId}/`, { method: 'POST', body: { token } })
  return str(at(response, 'data.uid64')) || str(at(response, 'uid64'))
}

const resetPin = ({ businessId, uid64, pin }: PinInput & { uid64: string; pin: string }) =>
  isLive() ? apiRequest<unknown>(`wallet/reset_pin/${businessId}/`, { method: 'PATCH', body: { uid64, pin } }) : mockDelay(null, 500)

export const useSetPin = () => useMutation({ mutationFn: setPin })
export const useChangePin = () => useMutation({ mutationFn: changePin })
export const useRequestPinReset = () => useMutation({ mutationFn: requestPinReset })
export const useVerifyPinReset = () => useMutation({ mutationFn: verifyPinReset })
export const useResetPin = () => useMutation({ mutationFn: resetPin })
