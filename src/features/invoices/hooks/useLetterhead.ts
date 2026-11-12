import { useCurrentBusiness } from '@/api/business'

export type PayTo = { bank: string; account: string; name: string }

/**
 * The business's phone, email and payment account for the invoice letterhead.
 * Read from the business record (GET business/{id}/, already cached app-wide).
 */
export function useLetterhead() {
  const { data: business } = useCurrentBusiness()
  const banks = business?.banks ?? []
  const bank = banks.find(item => item.account_number && !item.is_sub) ?? banks.find(item => item.account_number)
  return {
    contactLine: [business?.phone, business?.email].filter(Boolean).join('  ·  '),
    payTo: bank ? { bank: bank.bank_name ?? '', account: bank.account_number ?? '', name: bank.account_name ?? '' } : null,
  }
}
