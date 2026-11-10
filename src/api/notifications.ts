import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { useCurrentBusinessId } from './business'
import { asRecord, isLive, num } from './http'

/**
 * Unread badge for the top-bar bell, same endpoint as sink-inventory:
 *  GET notification/unread-count/{business_id}/ → { unread_notifications_count }
 * (the feed endpoint names it `unread_count`, so both are accepted).
 */
const getUnreadCount = async (businessId: string) => {
  const payload = asRecord(await apiRequest<unknown>(`notification/unread-count/${businessId}/`))
  const data = asRecord(payload.data ?? payload)
  return num(data.unread_notifications_count ?? data.unread_count)
}

export const useUnreadNotifications = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: ['notifications', 'unread', businessId],
    queryFn: () => getUnreadCount(businessId as string),
    enabled: isLive() && Boolean(businessId),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
