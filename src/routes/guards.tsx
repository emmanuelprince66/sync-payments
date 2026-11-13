import { Suspense, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { toast } from 'sonner'
import { useCurrentBusinessId } from '@/api/business'
import { usePermissions } from '@/hooks/usePermissions'
import { AppLoader } from '@/components/ui/AppLoader'
import { useBusinessStore } from '@/stores/business-store'
import { useIsAuthenticated } from '@/stores/auth-store'
import { paths } from './paths'

/** Signed-in only. Remembers where the user was headed. */
export function RequireAuth() {
  const authenticated = useIsAuthenticated()
  const location = useLocation()
  if (!authenticated) return <><AppLoader/><Navigate to={paths.login} replace state={{ from: location.pathname }}/></>
  return <Suspense fallback={<AppLoader/>}><Outlet/></Suspense>
}

/** Login screen only for signed-out users. Signup onboarding steps stay reachable after the auto-login. */
export function GuestOnly() {
  const authenticated = useIsAuthenticated()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  // Show the loader during the hand-off: the redirect alone renders nothing, which flashed a blank screen.
  // Signed-in users always pick a business next, as in sink-inventory.
  if (authenticated) return <><AppLoader/><Navigate to={paths.selectBusiness} replace state={{ from }}/></>
  return <Suspense fallback={<AppLoader/>}><Outlet/></Suspense>
}

/**
 * App routes need a selected business (every business-scoped call is keyed on it).
 * No selection → the picker, remembering where the user was headed. While the
 * business list loads (to confirm the stored id is still valid), show the loader.
 */
export function RequireBusiness() {
  const businessId = useBusinessStore(state => state.businessId)
  const { isResolving } = useCurrentBusinessId()
  const location = useLocation()
  if (!businessId) return <><AppLoader/><Navigate to={paths.selectBusiness} replace state={{ from: location.pathname }}/></>
  if (isResolving) return <AppLoader label="Loading your business"/>
  return <Suspense fallback={<AppLoader/>}><Outlet/></Suspense>
}

/** Sends a user without access back to Overview, saying why (one toast, even under StrictMode). */
function Blocked() {
  useEffect(() => { toast.error('You don’t have access to that page', { id: 'route-blocked', description: 'Ask your business owner or an admin for access.' }) }, [])
  return <Navigate to={paths.overview} replace/>
}

/**
 * Pages decided by the login's permissions (sink's middleware: pageAllowed, then role rules). The route
 * → area table is lib/access-map.ts PAGE_AREAS; Overview has no area, so a refused page lands there.
 */
export function RequirePage() {
  const { canOpen } = usePermissions()
  const { pathname } = useLocation()
  if (!canOpen(pathname)) return <Blocked/>
  return <Outlet/>
}
