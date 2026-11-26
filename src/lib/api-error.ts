/**
 * The first readable message in an API error body (sink-inventory's lib/apiError firstApiError).
 *
 * The backend answers in two shapes: { message: "..." } and DRF's field dictionary, where the text is a level
 * down inside a list, e.g. { business_type: ["business_type is required for corporate account ..."] }.
 * Reading only message/error turned the second kind into "Request failed (400)", leaving people at a form that
 * looks complete with no idea which field was rejected.
 */

/** Wrappers the real errors sit inside. */
const WRAPPERS = ['details', 'payload', 'errors', 'data']
const SKIP = ['message', 'error', 'detail', 'status_code', 'status', 'success', ...WRAPPERS]

const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** A server error page (HTML) or a stack trace is not a message anyone should read. */
const readable = (text: string) => {
  const trimmed = text.trim()
  return trimmed && trimmed.length <= 300 && !/^<|<html|<!doctype/i.test(trimmed) ? trimmed : ''
}

/** Field keys read as words: "business_type" → "Business type". */
const fieldLabel = (key: string) => {
  const words = key.replace(/[_-]+/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : ''
}

export const firstApiError = (body: unknown, fallback: string, depth = 0): string => {
  if (typeof body === 'string') return readable(body) || fallback
  if (depth > 6 || !body) return fallback

  if (Array.isArray(body)) {
    for (const entry of body) {
      const found = firstApiError(entry, '', depth + 1)
      if (found) return found
    }
    return fallback
  }
  if (!isPlainObject(body)) return fallback

  // A message the server wrote for display wins over a field error.
  for (const key of ['message', 'error', 'detail']) {
    const value = body[key]
    if (typeof value === 'string' && readable(value)) return readable(value)
  }
  for (const key of WRAPPERS) {
    if (key in body) {
      const found = firstApiError(body[key], '', depth + 1)
      if (found) return found
    }
  }
  // Any field: { phone: ["This field may not be blank."] } → "Phone: This field may not be blank."
  for (const [key, value] of Object.entries(body)) {
    if (SKIP.includes(key)) continue
    const found = firstApiError(value, '', depth + 1)
    if (!found) continue
    // non_field_errors is DRF's bucket for whole-form errors: no field to name.
    const label = key === 'non_field_errors' ? '' : fieldLabel(key)
    return label && !found.toLowerCase().includes(key.toLowerCase().replace(/_/g, ' ')) && !found.toLowerCase().includes(key.toLowerCase()) ? `${label}: ${found}` : found
  }
  return fallback
}
