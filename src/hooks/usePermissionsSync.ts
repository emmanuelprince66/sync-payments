import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { isLive } from '@/api/http'
import { apiRequest } from '@/lib/api-client'
import { readMyPermissions } from '@/lib/sink-permissions'
import { useAuthStore, type UserRole } from '@/stores/auth-store'

/** How often to pick up permission changes the owner made (sink: PermissionsSync). */
const REFRESH_MS = 2 * 60 * 1000

/**
 * Keeps the signed-in staff member's role and permissions current, as sink's PermissionsSync does:
 * GET user/me/permissions/ every two minutes and when the tab is focused, for staff only (owners can
 * do everything). Only a response with a checklist replaces what the login stored. Live mode only.
 */
export function usePermissionsSync() {
  const signedIn = useAuthStore(state => Boolean(state.accessToken))
  const role = useAuthStore(state => state.user?.role)
  const { data } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: () => apiRequest<unknown>('user/me/permissions/'),
    enabled: isLive() && signedIn && Boolean(role) && role !== 'OWNER',
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: false,
  })

  useEffect(() => {
    const fresh = readMyPermissions(data)
    if (!fresh?.permissions.permissions_matrix) return
    const { user, updateUser } = useAuthStore.getState()
    if (!user) return
    const roleChanged = Boolean(fresh.role) && fresh.role !== user.role
    const permissionsChanged = JSON.stringify(fresh.permissions) !== JSON.stringify(user.permissions)
    if (!roleChanged && !permissionsChanged) return
    updateUser({ ...(roleChanged && { role: fresh.role as UserRole }), permissions: fresh.permissions })
  }, [data])
}
