import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
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

const REMEMBER_KEY = 'syncpay-remember'

/** "Keep me signed in": on → the session survives closing the browser (localStorage); off → this tab only (sessionStorage). */
export const setRememberMe = (remember: boolean) => {
  try { localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0') } catch { /* storage blocked */ }
}
const rememberMe = () => { try { return localStorage.getItem(REMEMBER_KEY) !== '0' } catch { return true } }

const sessionAwareStorage: StateStorage = {
  getItem: name => { try { return localStorage.getItem(name) ?? sessionStorage.getItem(name) } catch { return null } },
  setItem: (name, value) => {
    try {
      const [keep, drop] = rememberMe() ? [localStorage, sessionStorage] : [sessionStorage, localStorage]
      keep.setItem(name, value)
      drop.removeItem(name)
    } catch { /* storage blocked */ }
  },
  removeItem: name => { try { localStorage.removeItem(name); sessionStorage.removeItem(name) } catch { /* storage blocked */ } },
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
    { name: 'syncpay-auth', storage: createJSONStorage(() => sessionAwareStorage) },
  ),
)

export const useIsAuthenticated = () => useAuthStore(state => Boolean(state.accessToken))
export const useUserRole = () => useAuthStore(state => state.user?.role)
