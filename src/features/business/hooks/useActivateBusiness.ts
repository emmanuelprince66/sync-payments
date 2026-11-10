import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toSelectedBusiness, type Business } from '@/api/business'
import { queryKeys } from '@/api/query-keys'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { useBusinessStore } from '@/stores/business-store'
import { resetBusinessScopedStores } from '@/stores/reset-business-scope'

/**
 * Makes a business the one the app works in. When it differs from the current
 * one, everything scoped to the old business is dropped first: the persisted
 * stores and every cached query except the business list itself, so no data
 * from the previous business can show (sink-inventory's "switch business" rule).
 */
export function useActivateBusiness() {
  const queryClient = useQueryClient()
  const setBusinessId = useBusinessStore(state => state.setBusinessId)
  const setBusinessData = useBusinessDataStore(state => state.setBusinessData)

  return useCallback((business: Business) => {
    const currentId = useBusinessStore.getState().businessId
    if (currentId !== business.id) {
      resetBusinessScopedStores()
      queryClient.removeQueries({ predicate: query => query.queryKey[0] !== queryKeys.businesses[0] })
    }
    setBusinessId(business.id)
    setBusinessData(toSelectedBusiness(business))
  }, [queryClient, setBusinessId, setBusinessData])
}
