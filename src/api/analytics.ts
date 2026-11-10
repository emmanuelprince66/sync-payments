import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useCurrentBusinessId } from './business'
import { asRecord, isLive, num } from './http'
import { queryKeys } from './query-keys'

/**
 * Sales summary for the overview:
 *  GET analytic/sales/{business_id}/?start_date&end_date
 *    → { total_Revenue, total_Revenue_change, transaction_count, transaction_count_change, ... }
 */
export type SalesSummary = { revenue: number; revenueChange: number; count: number; countChange: number }

const getSales = async (businessId: string, startDate: string, endDate: string): Promise<SalesSummary> => {
  const params = new URLSearchParams()
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)
  const response = asRecord(await apiRequest<unknown>(`analytic/sales/${businessId}/?${params.toString()}`))
  const data = asRecord(response.data ?? response)
  return { revenue: num(data.total_Revenue), revenueChange: num(data.total_Revenue_change), count: num(data.transaction_count), countChange: num(data.transaction_count_change) }
}

export const useSalesSummary = (startDate: string, endDate: string) => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...queryKeys.analytics, 'sales', businessId, startDate, endDate],
    queryFn: () => (isLive() ? getSales(businessId as string, startDate, endDate) : mockDelay<SalesSummary>({ revenue: 318240, revenueChange: 12.4, count: 148, countChange: 6 })),
    enabled: !isLive() || Boolean(businessId),
    placeholderData: keepPreviousData,
  })
}
