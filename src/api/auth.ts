import { useMutation } from '@tanstack/react-query'
import { env } from '@/config/env'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'

/**
 * Real Sync360 auth endpoints (same contract sink-inventory uses):
 *  POST auth/login/         { email, password }                         → { tokens: { access, refresh }, ...user }
 *  POST auth/signup/        { firstname, lastname, phone, email, password }
 *  POST auth/verify-phone/  { token, phone }
 * Set VITE_AUTH_MODE=mock to bypass the backend with a demo account.
 */

export type LoginInput = { email: string; password: string }
export type SignupInput = { firstname: string; lastname: string; phone: string; email: string; password: string }
export type VerifyPhoneInput = { token: string; phone: string }

type LoginResponse = AuthUser & { tokens: { access: string; refresh: string } }

const DEMO_USER: AuthUser = { firstname: 'Kemi', lastname: 'Adeyemi', email: 'kemi@kemistore.com', phone: '0802 400 1294', role: 'OWNER' }

const login = async (input: LoginInput): Promise<LoginResponse> => {
  if (env.authMode === 'mock') return mockDelay({ ...DEMO_USER, email: input.email || DEMO_USER.email, tokens: { access: 'demo-access', refresh: 'demo-refresh' } })
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
