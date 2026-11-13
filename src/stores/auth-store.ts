import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { resetBusinessScopedStores } from './reset-business-scope'
import type { Permissions } from '@/lib/sink-permissions'
import type { UserRole } from './types'

export type { UserRole } from './types'

export type AuthUser = {
  id?: string | number
  firstname?: string
  lastname?: string
  name?: string
  fullName?: string
  email: string
  phone?: string
  role?: UserRole
  /**
   * Staff permissions from the login response (sink: `permissions`): on/off flags, expense ceilings and
   * the `permissions_matrix` checklist. Owners have all of them. Missing on sessions saved before this
   * was stored: those fall back to sink's role rules (lib/sink-permissions.ts).
   */
  permissions?: Permissions
}

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  setSession: (session: { accessToken: string; refreshToken?: string | null; user: AuthUser }) => void
  /** sink: updateUser. Used by the permissions refresh (role or permissions changed by the owner). */
  updateUser: (patch: Partial<AuthUser>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken = null, user }) => {
        // Every sign-in starts without a business: the user picks one next (as in sink-inventory),
        // and nothing selected in a previous session can leak into this one.
        resetBusinessScopedStores()
        set({ accessToken, refreshToken, user })
      },
      updateUser: patch => set(state => (state.user ? { user: { ...state.user, ...patch } } : {})),
      logout: () => {
        // The selected business belongs to the session that just ended, not to the browser.
        resetBusinessScopedStores()
        set({ accessToken: null, refreshToken: null, user: null })
      },
    }),
    { name: 'syncpay-auth' },
  ),
)

export const useIsAuthenticated = () => useAuthStore(state => Boolean(state.accessToken))
export const useUserRole = () => useAuthStore(state => state.user?.role)
