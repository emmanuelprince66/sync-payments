import { useMutation } from '@tanstack/react-query'
import { env } from '@/config/env'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { mockPermissionsFor } from '@/lib/sink-permissions'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'

/**
 * Real Sync360 auth endpoints (same contract sink-inventory uses):
 *  POST auth/login/         { email, password }                         → { tokens: { access, refresh }, ...user }
 *  POST auth/signup/        { firstname, lastname, phone, email, password, referal? }
 *  POST auth/verify-phone/  { token, phone }
 * Set VITE_AUTH_MODE=mock to bypass the backend with a demo account.
 */

export type LoginInput = { email: string; password: string }
export type SignupInput = { firstname: string; lastname: string; phone: string; email: string; password: string; referal?: string }
export type VerifyPhoneInput = { token: string; phone: string }

type LoginResponse = AuthUser & { tokens: { access: string; refresh: string } }

const DEMO_USER: AuthUser = { id: 'demo-owner', firstname: 'Kemi', lastname: 'Adeyemi', email: 'kemi@kemistore.com', phone: '0802 400 1294', role: 'OWNER' }

/**
 * Sample-data logins for trying the roles, by the part of the email before "@" (e.g. attendant@kemistore.com).
 * Each carries a `permissions` object shaped like the real login's (flags + permissions_matrix), from the
 * sample role defaults in lib/sink-permissions.ts:
 *  - admin@      super admin (ADMIN-ATTENDANT) with the admin defaults
 *  - attendant@  attendant with the attendant defaults
 *  - bank@       attendant with banking:view/manage ticked as well (manage_bank_details)
 *  - legacy@     attendant whose saved session predates permissions (none at all → role rules)
 * Anything else signs in as the owner.
 */
const DEMO_STAFF: Record<string, AuthUser> = {
  attendant: { id: 'demo-attendant', firstname: 'Ada', lastname: 'Okeke', email: 'attendant@kemistore.com', phone: '0805 444 5566', role: 'ATTENDANT', permissions: mockPermissionsFor('ATTENDANT') },
  admin: { id: 'demo-admin', firstname: 'Tola', lastname: 'Martins', email: 'admin@kemistore.com', phone: '0803 111 2233', role: 'ADMIN-ATTENDANT', permissions: mockPermissionsFor('ADMIN-ATTENDANT') },
  bank: { id: 'demo-bank', firstname: 'Bayo', lastname: 'Ojo', email: 'bank@kemistore.com', phone: '0806 222 7788', role: 'ATTENDANT', permissions: mockPermissionsFor('ATTENDANT', { banking: ['view', 'manage'] }) },
  legacy: { id: 'demo-legacy', firstname: 'Ngozi', lastname: 'Eze', email: 'legacy@kemistore.com', phone: '0807 333 9900', role: 'ATTENDANT' },
}

const demoUserFor = (email: string): AuthUser => {
  const staff = DEMO_STAFF[email.trim().toLowerCase().split('@')[0]]
  return staff ? { ...staff, email: email.trim() } : { ...DEMO_USER, email: email.trim() || DEMO_USER.email }
}

const login = async (input: LoginInput): Promise<LoginResponse> => {
  if (env.authMode === 'mock') return mockDelay({ ...demoUserFor(input.email), tokens: { access: 'demo-access', refresh: 'demo-refresh' } })
  return apiRequest<LoginResponse>('auth/login/', { method: 'POST', body: input, auth: false })
}

const signup = (input: SignupInput) =>
  env.authMode === 'mock' ? mockDelay({ ok: true }) : apiRequest<unknown>('auth/signup/', { method: 'POST', body: input, auth: false })

const verifyPhone = (input: VerifyPhoneInput) =>
  env.authMode === 'mock' ? mockDelay({ ok: true }) : apiRequest<unknown>('auth/verify-phone/', { method: 'POST', body: input, auth: false })

/** Logs in and stores the session (token persisted to localStorage). */
export const useLogin = () => {
  const setSession = useAuthStore(state => state.setSession)
  return useMutation({
    mutationFn: login,
    onSuccess: ({ tokens, ...user }) => setSession({ accessToken: tokens.access, refreshToken: tokens.refresh, user }),
  })
}

export const useSignup = () => useMutation({ mutationFn: signup })
export const useVerifyPhone = () => useMutation({ mutationFn: verifyPhone })

export const useLogout = () => useAuthStore(state => state.logout)

/** Pulls a readable message out of any thrown error. */
export const errorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') =>
  error instanceof Error && error.message ? error.message : fallback
