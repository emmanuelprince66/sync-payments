import { env } from '@/config/env'
import { firstApiError } from '@/lib/api-error'
import { useAuthStore } from '@/stores/auth-store'
import { PLAN_GATE_COPY, planGateKind, usePlanGateStore } from '@/stores/plan-gate-store'

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown
  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; auth?: boolean }

/** The backend's own words, from { message } or a DRF field dictionary (lib/api-error). */
const messageFrom = (data: unknown, fallback: string) => firstApiError(data, fallback)

/**
 * Thin fetch wrapper for the Sync360 API: adds the bearer token, parses JSON,
 * and turns non-2xx responses into ApiError. A 401 on an authenticated call
 * signs the user out, since the backend does not expose a refresh flow we use.
 */
export async function apiRequest<T>(path: string, { body, auth = true, headers, ...init }: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`${env.apiBaseUrl}${path.replace(/^\//, '')}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const raw = await response.text()
  let data: unknown
  try { data = raw ? JSON.parse(raw) : null } catch { data = raw }

  if (!response.ok) {
    if (response.status === 401 && auth) useAuthStore.getState().logout()
    // A plan refusal ("1" / "2" / "3") opens the upgrade dialog and reads as a sentence, never a bare code.
    const planKind = planGateKind(data)
    if (planKind) {
      usePlanGateStore.getState().show(planKind)
      throw new ApiError(PLAN_GATE_COPY[planKind].short, response.status, data)
    }
    throw new ApiError(messageFrom(data, `Request failed (${response.status})`), response.status, data)
  }
  return data as T
}

/** Simulated latency for endpoints that don't exist on the backend yet. */
export const mockDelay = <T>(value: T, ms = 450) => new Promise<T>(resolve => setTimeout(() => resolve(value), ms))
