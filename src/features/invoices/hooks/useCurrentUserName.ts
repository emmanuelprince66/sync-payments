import { useAuthStore } from '@/stores/auth-store'

/** The signed-in user's display name, saved as "Created by" / "Recorded by" on invoices. */
export function useCurrentUserName() {
  const user = useAuthStore(state => state.user)
  const fromParts = [user?.firstname, user?.lastname].filter(Boolean).join(' ')
  return fromParts || user?.fullName || user?.name || user?.email?.split('@')[0] || 'Team member'
}
