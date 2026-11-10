/**
 * Small helpers shared by the live (Sync360) services: the mock/live switch,
 * multipart requests, and tolerant readers for the backend's varied envelopes.
 */
import { env } from '@/config/env'
import { ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

/** True when talking to the real backend. VITE_AUTH_MODE=mock keeps the whole app on sample data. */
export const isLive = () => env.authMode === 'api'

/** Thrown when a live call needs the business id but none has resolved yet. */
export class MissingBusinessError extends ApiError {
  constructor() {
    super('No business found for this account. Create a business in Sync360 first.', 400, null)
    this.name = 'MissingBusinessError'
  }
}

/** multipart/form-data request (product create/edit use FormData in sink-inventory). */
export async function apiFormRequest<T>(path: string, method: 'POST' | 'PATCH', form: FormData): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`${env.apiBaseUrl}${path.replace(/^\//, '')}`, {
    method,
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  })
  const raw = await response.text()
  let data: unknown = raw
  try { data = raw ? JSON.parse(raw) : null } catch { /* keep raw text */ }
  if (!response.ok) {
    if (response.status === 401) useAuthStore.getState().logout()
    const record = asRecord(data)
    const message = str(record.message) || str(record.error) || str(record.detail) || `Request failed (${response.status})`
    throw new ApiError(message, response.status, data)
  }
  return data as T
}

// ─── Tolerant readers (the API mixes strings/numbers and nests envelopes) ───

export type UnknownRecord = Record<string, unknown>

export const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {}

export const str = (value: unknown): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''

export const num = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(str(value))
  return Number.isFinite(parsed) ? parsed : 0
}

/** First array found at any of the given paths, e.g. listFrom(res, ['results.data', 'results', 'data']). */
export const listFrom = (value: unknown, paths: string[]): unknown[] => {
  if (Array.isArray(value)) return value
  for (const path of paths) {
    const found = path.split('.').reduce<unknown>((current, key) => asRecord(current)[key], value)
    if (Array.isArray(found)) return found
  }
  return []
}

/** Reads a nested value by dotted path. */
export const at = (value: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((current, key) => asRecord(current)[key], value)

/** "Today, 10:24 AM" / "Yesterday, 3:45 PM" / "Aug 24, 11:02 AM" — the design's date style. */
export const formatActivityDate = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`
}

/** "Aug 25, 2025" — wallet transaction dates. */
export const formatShortDate = (iso: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
