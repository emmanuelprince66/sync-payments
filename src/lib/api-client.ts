import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth-store'

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

const messageFrom = (data: unknown, fallback: string) => {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const detail = record.message ?? record.error ?? record.detail
    if (typeof detail === 'string' && detail) return detail
  }
  return fallback
}

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
    throw new ApiError(messageFrom(data, `Request failed (${response.status})`), response.status, data)
  }
  return data as T
}

/** Simulated latency for endpoints that don't exist on the backend yet. */
export const mockDelay = <T>(value: T, ms = 450) => new Promise<T>(resolve => setTimeout(() => resolve(value), ms))
