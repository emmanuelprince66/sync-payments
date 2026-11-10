import { useCallback } from 'react'
import { formatMoney } from '@/lib/money'
import { useBusinessDataStore } from '@/stores/business-data-store'

/** Formats amounts in the selected business's currency (naira by default), as sink-inventory's useFormatMoney does. */
export function useFormatMoney() {
  const currency = useBusinessDataStore(state => state.businessData?.currency) || 'NGN'
  return useCallback((amount: number) => formatMoney(amount, currency), [currency])
}
