import { useBusinessDataStore } from '@/stores/business-data-store'

/** Business currency code and symbol, for labels and amount inputs ("NGN", "₦"). */
export function useBusinessCurrency() {
  const code = (useBusinessDataStore(state => state.businessData?.currency) || 'NGN').toUpperCase()
  const symbol = new Intl.NumberFormat('en-NG', { style: 'currency', currency: code }).formatToParts(0).find(part => part.type === 'currency')?.value ?? code
  return { code, symbol }
}
