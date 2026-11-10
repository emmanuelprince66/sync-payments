import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest, mockDelay } from '@/lib/api-client'
import { fetchCurrentBusiness, requireBusinessId, useCurrentBusinessId } from './business'
import { apiFormRequest, asRecord, isLive, listFrom, str } from './http'
import { queryKeys } from './query-keys'

/**
 * Storefront settings, ported from SyncShip (itself sink-inventory's store-info /
 * e-setup / general-settings screens). Same backend contract:
 *  GET   business/{id}/              → profile (name, type, tag_line, logo, banners, store_theme, …)
 *  PATCH business/{id}/ (multipart)  → profile fields, logo, banners + existing_banners,
 *                                       working_days / delivery_days, custom_domain,
 *                                       allow_sales_without_stock
 *  PATCH business/{id}/ (JSON)       → { enable_bnpl } (eligibility errors come back keyed on the field)
 *  GET   business/store_themes/      → { default, themes: StoreTheme[] }
 * Mock mode (VITE_AUTH_MODE=mock) keeps everything on the sample profile below.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

export type StoreTheme = { key: string; label: string; primary: string; on_primary: string; surface: string; accent: string }

/** Mirrors the backend's closed STORE_THEMES enum; also the fallback while the list loads. */
export const STORE_THEMES: StoreTheme[] = [
  { key: 'emerald', label: 'Emerald', primary: '#047857', on_primary: '#FFFFFF', surface: '#ECFDF5', accent: '#10B981' },
  { key: 'royal', label: 'Royal Blue', primary: '#1D4ED8', on_primary: '#FFFFFF', surface: '#EFF6FF', accent: '#3B82F6' },
  { key: 'plum', label: 'Plum', primary: '#7E22CE', on_primary: '#FFFFFF', surface: '#FAF5FF', accent: '#A855F7' },
  { key: 'indigo', label: 'Indigo', primary: '#4338CA', on_primary: '#FFFFFF', surface: '#EEF2FF', accent: '#6366F1' },
  { key: 'violet', label: 'Violet', primary: '#6D28D9', on_primary: '#FFFFFF', surface: '#F5F3FF', accent: '#8B5CF6' },
  { key: 'rose', label: 'Rose', primary: '#BE123C', on_primary: '#FFFFFF', surface: '#FFF1F2', accent: '#F43F5E' },
  { key: 'sunset', label: 'Sunset Orange', primary: '#C2410C', on_primary: '#FFFFFF', surface: '#FFF7ED', accent: '#F97316' },
  { key: 'bronze', label: 'Bronze', primary: '#92400E', on_primary: '#FFFFFF', surface: '#FFFBEB', accent: '#D97706' },
  { key: 'amber', label: 'Amber', primary: '#B45309', on_primary: '#FFFFFF', surface: '#FFFBEB', accent: '#F59E0B' },
  { key: 'teal', label: 'Teal', primary: '#0F766E', on_primary: '#FFFFFF', surface: '#F0FDFA', accent: '#14B8A6' },
  { key: 'charcoal', label: 'Charcoal', primary: '#334155', on_primary: '#FFFFFF', surface: '#F8FAFC', accent: '#64748B' },
]
export const DEFAULT_THEME = STORE_THEMES[0]

export const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'CNY', 'INR', 'JPY', 'CHF', 'NZD', 'RUB', 'BRL', 'MXN', 'SGD', 'HKD', 'SEK'] as const

export const BUSINESS_SECTOR_OPTIONS = [
  'Food & Restaurant', 'Beauty & Personal Care', 'Book & Stationery', 'Minimart & Retail', 'Electronics & Gadget', 'Laundry',
  'Salon Business', 'Pharmacy & Health Products', 'Home & Furniture', 'Construction Material & Suppliers', 'Logistics & Others',
] as const

/** Backend weekday enum, used by working_days and delivery_days. */
export const WEEK_DAYS = [
  { value: 'MONDAY', short: 'Mon' }, { value: 'TUESDAY', short: 'Tue' }, { value: 'WEDNESDAY', short: 'Wed' },
  { value: 'THURSDAY', short: 'Thu' }, { value: 'FRIDAY', short: 'Fri' }, { value: 'SATURDAY', short: 'Sat' }, { value: 'SUNDAY', short: 'Sun' },
] as const
export type WeekDay = typeof WEEK_DAYS[number]['value']

/** CNAME target merchants point a custom domain at. */
export const STORE_DNS_TARGET = 'store.sync360.africa'
export const MAX_BANNERS = 6
const PLATFORM_STORE_ORIGIN = 'https://store.sync360.africa'

// ─── Profile ────────────────────────────────────────────────────────────────

export type StorefrontProfile = {
  name: string
  sector: string
  tagline: string
  description: string
  phone: string
  whatsapp: string
  email: string
  street: string
  city: string
  state: string
  country: string
  zipCode: string
  currency: string
  /** Hex brand colour (older stores saved a preset key; resolved to hex on read). */
  theme: string
  logo: string
  banners: string[]
  workingDays: WeekDay[]
  deliveryDays: WeekDay[]
  storeSlug: string
  customDomain: string
  customDomainApproved: boolean
  enableBnpl: boolean
  allowSalesWithoutStock: boolean
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export const resolveThemeHex = (value?: string | null) => {
  const trimmed = value?.trim()
  if (trimmed && HEX.test(trimmed)) return trimmed.toUpperCase()
  return STORE_THEMES.find(theme => theme.key === trimmed)?.primary ?? DEFAULT_THEME.primary
}

/** The preset matching a hex, or null for an unknown custom colour. */
export const themeForHex = (hex: string, themes: StoreTheme[] = STORE_THEMES) =>
  themes.find(theme => theme.primary.toLowerCase() === hex.toLowerCase()) ?? null

export const normalizeStoreDomain = (domain: string) => domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase()

export type StoreChannel = 'OUTSTORE' | 'INSTORE'

/** Public store links: online (out-store) and in-store (QR at the counter). */
export const getStoreUrl = (profile: Pick<StorefrontProfile, 'storeSlug' | 'customDomain' | 'customDomainApproved'>, channel: StoreChannel) => {
  if (profile.customDomainApproved && profile.customDomain.trim()) return `https://${normalizeStoreDomain(profile.customDomain)}/${channel === 'INSTORE' ? 'in' : 'out'}`
  return `${PLATFORM_STORE_ORIGIN}/${channel === 'INSTORE' ? 'i' : 'o'}/${profile.storeSlug}`
}

const weekDays = (value: unknown): WeekDay[] =>
  Array.isArray(value) ? value.map(str).filter((day): day is WeekDay => WEEK_DAYS.some(item => item.value === day)) : []

const mapProfile = (value: unknown): StorefrontProfile => {
  const outer = asRecord(value)
  const record = outer.id || outer.name ? outer : asRecord(outer.data)
  const owner = asRecord(record.owner)
  const banners = listFrom(record.banners, []).map(str).filter(Boolean)
  const legacyBanner = str(record.banner)
  if (legacyBanner && !banners.includes(legacyBanner)) banners.unshift(legacyBanner)
  return {
    name: str(record.name),
    sector: str(record.type),
    tagline: str(record.tag_line),
    description: str(record.description),
    phone: str(record.phone) || str(owner.phone),
    whatsapp: str(record.whatsapp_number),
    email: str(record.email) || str(owner.email),
    street: str(record.street),
    city: str(record.city),
    state: str(record.state),
    country: str(record.country) || 'Nigeria',
    zipCode: str(record.zip_code),
    currency: str(record.currency) || 'NGN',
    theme: resolveThemeHex(str(record.store_theme)),
    logo: str(record.logo),
    banners,
    workingDays: weekDays(record.working_days),
    deliveryDays: weekDays(record.delivery_days),
    storeSlug: str(record.store_url),
    customDomain: str(record.custom_domain),
    customDomainApproved: record.custom_domain_approved === true,
    enableBnpl: record.enable_bnpl === true,
    allowSalesWithoutStock: record.allow_sales_without_stock === true,
  }
}

let sampleProfile: StorefrontProfile = {
  name: 'Kemi’s Store',
  sector: 'Minimart & Retail',
  tagline: 'Everyday pieces, thoughtfully selected.',
  description: 'Handpicked bags, accessories and home fragrances, delivered across Lagos.',
  phone: '+2348024001294',
  whatsapp: '+2348024001294',
  email: 'hello@kemistore.com',
  street: '22 Awolowo Road',
  city: 'Ikoyi',
  state: 'Lagos',
  country: 'Nigeria',
  zipCode: '',
  currency: 'NGN',
  theme: DEFAULT_THEME.primary,
  logo: '',
  banners: [],
  workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  deliveryDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  storeSlug: 'kemi-store',
  customDomain: '',
  customDomainApproved: false,
  enableBnpl: false,
  allowSalesWithoutStock: false,
}

/** The store profile, read from the shared GET business/{id}/ cache (no extra request). */
export const useStorefrontProfile = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...queryKeys.storefront, 'profile', isLive() ? businessId : 'mock'],
    queryFn: async () => (isLive() ? mapProfile((await fetchCurrentBusiness()).raw) : mockDelay({ ...sampleProfile })),
    enabled: !isLive() || Boolean(businessId),
  })
}

// ─── Themes ─────────────────────────────────────────────────────────────────

const getThemes = async (): Promise<StoreTheme[]> => {
  if (!isLive()) return STORE_THEMES
  const response = asRecord(await apiRequest<unknown>('business/store_themes/'))
  const root = asRecord(response.data ?? response)
  const list: unknown = root.themes ?? root.results ?? root
  const entries = Array.isArray(list)
    ? list.map(item => [str(asRecord(item).key), item] as const)
    : Object.entries(asRecord(list))
  const themes = entries
    .map(([key, item]) => {
      const theme = asRecord(item)
      return { key: str(theme.key) || key, label: str(theme.label) || key, primary: str(theme.primary), on_primary: str(theme.on_primary) || '#FFFFFF', surface: str(theme.surface), accent: str(theme.accent) }
    })
    .filter(theme => HEX.test(theme.primary))
  return themes.length ? themes : STORE_THEMES
}

export const useStoreThemes = () => useQuery({ queryKey: [...queryKeys.storefront, 'themes', isLive()], queryFn: getThemes, staleTime: 60 * 60 * 1000, placeholderData: STORE_THEMES })

// ─── Writes ─────────────────────────────────────────────────────────────────

export type StorefrontPatch = Partial<Omit<StorefrontProfile, 'logo' | 'banners' | 'storeSlug' | 'customDomainApproved' | 'enableBnpl'>> & {
  logoFile?: File
  /** When set, the saved banner URLs to keep (in order) and new files to append. */
  banners?: { keep: string[]; add: File[] }
}

const FIELD_MAP: Partial<Record<keyof StorefrontPatch, string>> = {
  name: 'name', sector: 'type', tagline: 'tag_line', description: 'description', phone: 'phone', whatsapp: 'whatsapp_number',
  email: 'email', street: 'street', city: 'city', state: 'state', country: 'country', zipCode: 'zip_code', currency: 'currency',
  theme: 'store_theme', customDomain: 'custom_domain',
}

const toForm = (patch: StorefrontPatch) => {
  const form = new FormData()
  for (const [key, field] of Object.entries(FIELD_MAP) as [keyof StorefrontPatch, string][]) {
    const value = patch[key]
    // Nullable fields are only sent when set, so a blank input never wipes a saved value.
    if (typeof value === 'string' && value.trim()) form.append(field, value.trim())
  }
  if (patch.allowSalesWithoutStock !== undefined) form.append('allow_sales_without_stock', String(patch.allowSalesWithoutStock))
  patch.workingDays?.forEach(day => form.append('working_days', day))
  patch.deliveryDays?.forEach(day => form.append('delivery_days', day))
  if (patch.logoFile) form.append('logo', patch.logoFile)
  if (patch.banners) {
    form.append('existing_banners', JSON.stringify(patch.banners.keep))
    patch.banners.add.forEach(file => form.append('banners', file))
  }
  return form
}

const applyToSample = (patch: StorefrontPatch) => {
  const { logoFile, banners, ...fields } = patch
  sampleProfile = {
    ...sampleProfile,
    ...fields,
    ...(logoFile ? { logo: URL.createObjectURL(logoFile) } : {}),
    ...(banners ? { banners: [...banners.keep, ...banners.add.map(file => URL.createObjectURL(file))] } : {}),
  }
  return mockDelay({ ...sampleProfile }, 500)
}

const saveStorefront = async (patch: StorefrontPatch) =>
  isLive() ? mapProfile(await apiFormRequest<unknown>(`business/${requireBusinessId()}/`, 'PATCH', toForm(patch))) : applyToSample(patch)

const useInvalidateStorefront = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.business })
    return queryClient.invalidateQueries({ queryKey: queryKeys.storefront })
  }
}

/** Saves any subset of the storefront profile (text fields, theme, logo, banners, days, domain, stock rule). */
export const useSaveStorefront = () => {
  const invalidate = useInvalidateStorefront()
  return useMutation({ mutationFn: saveStorefront, onSuccess: invalidate })
}

/** The backend rejects BNPL with a message keyed on `enable_bnpl` (e.g. "Your wallet must be upgraded…"). */
export const bnplErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    const field = asRecord(error.data).enable_bnpl
    if (typeof field === 'string') return field
    if (Array.isArray(field) && field.length) return str(field[0])
    return error.message
  }
  return error instanceof Error ? error.message : 'Could not update your BNPL setting'
}

const setBnpl = async (enabled: boolean) => {
  if (!isLive()) {
    sampleProfile = { ...sampleProfile, enableBnpl: enabled }
    return mockDelay(null, 500)
  }
  return apiRequest<unknown>(`business/${requireBusinessId()}/`, { method: 'PATCH', body: { enable_bnpl: enabled } })
}

/** Buy-now-pay-later (Akawopay) for storefront and in-store checkout. */
export const useSetBnpl = () => {
  const invalidate = useInvalidateStorefront()
  return useMutation({ mutationFn: setBnpl, onSuccess: invalidate })
}
