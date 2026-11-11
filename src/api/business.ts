import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useBusinessDataStore, type SelectedBusiness } from '@/stores/business-data-store'
import { useBusinessStore } from '@/stores/business-store'
import { useIsAuthenticated } from '@/stores/auth-store'
import { apiFormRequest, asRecord, isLive, listFrom, MissingBusinessError, str, type UnknownRecord } from './http'
import { queryClient } from '@/lib/query-client'
import { queryKeys } from './query-keys'

/**
 * Sync360 business endpoints (same as sink-inventory):
 *  GET   business/        → { results: Business[] }
 *  GET   business/{id}/   → Business (with `shipbubble`, `banks`, `store_url`, …)
 *  PATCH business/{id}/   → partial update (JSON for nested `shipbubble_settings`)
 *  POST  business/        → create (multipart: name, type, currency, country, state, city, street, phone?, email?, delivery_days[]?, logo?)
 */

export type ShipbubbleCategory = { category_id: number; category: string }
export type ShipbubblePackageSize = { name: string; description_image_url: string; height: number | string; width: number | string; length: number | string; max_weight: number | string }

export type ShipbubbleSettings = {
  street?: string
  city?: string
  state?: string
  phone?: string
  landmark?: string
  category?: ShipbubbleCategory | null
  package_size?: ShipbubblePackageSize | null
  is_active?: boolean
  latitude?: string
  longitude?: string
}

export type BusinessBank = { id: string; bank_name?: string; account_number?: string; account_name?: string; is_sub?: boolean }

export type Business = {
  id: string
  name: string
  /** Logo URL ('' when none). */
  logo: string
  /** Business type/category, e.g. "Food & Restaurant". */
  type: string
  phone: string
  email: string
  street: string
  city: string
  state: string
  country: string
  storeUrl: string
  owner: string
  shipbubble: ShipbubbleSettings | null
  shippingCompanies: string[]
  banks: BusinessBank[]
  raw: UnknownRecord
}

export const mapBusiness = (value: unknown): Business => {
  const record = asRecord(value)
  const ownerRecord = asRecord(record.owner)
  const sb = asRecord(record.shipbubble ?? record.shipbubble_settings)
  return {
    id: str(record.id),
    name: str(record.name),
    logo: str(record.logo),
    type: str(record.type),
    phone: str(record.phone),
    email: str(record.email),
    street: str(record.street),
    city: str(record.city),
    state: str(record.state),
    country: str(record.country),
    storeUrl: str(record.store_url),
    owner: [str(ownerRecord.firstname), str(ownerRecord.lastname)].filter(Boolean).join(' '),
    shipbubble: Object.keys(sb).length ? (sb as ShipbubbleSettings) : null,
    shippingCompanies: Array.isArray(record.shipping_companies) ? record.shipping_companies.map(str) : [],
    banks: listFrom(record.banks, []).map(bank => {
      const b = asRecord(bank)
      return { id: str(b.id), bank_name: str(b.bank_name), account_number: str(b.account_number), account_name: str(b.account_name), is_sub: b.is_sub === true }
    }),
    raw: record,
  }
}

const getLiveBusinesses = async () => {
  const response = await apiRequest<unknown>('business/')
  return listFrom(response, ['results', 'data', 'results.data']).map(mapBusiness)
}

// ─── Sample businesses (VITE_AUTH_MODE=mock) ────────────────────────────────

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const sampleBusiness = (id: string, name: string, type: string, street: string, city: string): Business => ({
  id, name, logo: '', type, phone: '0802 400 1294', email: 'hello@kemistore.com', street, city, state: 'Lagos', country: 'Nigeria',
  storeUrl: `store.syncship.africa/${slug(name)}`, owner: 'Kemi Adeyemi', shipbubble: null, shippingCompanies: [], banks: [], raw: {},
})

let mockBusinesses: Business[] = [
  sampleBusiness('mock-business-1', 'Kemi’s Store', 'Minimart & Retail', '22 Awolowo Road', 'Ikoyi'),
  sampleBusiness('mock-business-2', 'Kemi Beauty Hub', 'Beauty & Personal Care', '14 Admiralty Way', 'Lekki'),
]

const getBusinesses = () => (isLive() ? getLiveBusinesses() : mockDelay([...mockBusinesses], 500))

/** One-line address for cards: "22 Awolowo Road, Ikoyi, Lagos". */
export const businessAddress = (business: Pick<Business, 'street' | 'city' | 'state'>) =>
  [business.street, business.city, business.state].filter(Boolean).join(', ')

/** The snapshot kept in useBusinessDataStore. */
export const toSelectedBusiness = (business: Business): SelectedBusiness => ({
  currency: str(business.raw.currency) || 'NGN',
  id: business.id, name: business.name, logo: business.logo, type: business.type, address: businessAddress(business), owner: business.owner,
})

const getBusiness = async (id: string) => {
  const response = asRecord(await apiRequest<unknown>(`business/${id}/`))
  return mapBusiness(response.id ? response : response.data)
}

/** Reads the resolved business id outside React (services/mutations). Throws if none. */
export const requireBusinessId = () => {
  const id = useBusinessStore.getState().businessId
  if (!id) throw new MissingBusinessError()
  return id
}

/** All businesses the user can access (GET business/). Sample businesses in mock mode. */
export const useBusinesses = () => {
  const authenticated = useIsAuthenticated()
  return useQuery({ queryKey: queryKeys.businesses, queryFn: getBusinesses, enabled: authenticated })
}

/**
 * The business every live call is keyed on: the one the user explicitly picked
 * on /select-business. As in sink-inventory there is no "first business"
 * fallback. If the stored id is no longer in the user's list it is cleared and
 * RequireBusiness sends the user back to the picker. The stored snapshot
 * (useBusinessDataStore) is refreshed whenever the list loads.
 */
export const useCurrentBusinessId = () => {
  const { data: businesses, isLoading } = useBusinesses()
  const businessId = useBusinessStore(state => state.businessId)
  const setBusinessId = useBusinessStore(state => state.setBusinessId)
  const clearBusinessId = useBusinessStore(state => state.clearBusinessId)
  const setBusinessData = useBusinessDataStore(state => state.setBusinessData)

  useEffect(() => {
    if (!businesses || !businessId) return
    const current = businesses.find(business => business.id === businessId)
    if (current) setBusinessData(toSelectedBusiness(current))
    else clearBusinessId()
  }, [businesses, businessId, setBusinessData, clearBusinessId])

  return { businessId: isLive() ? businessId : null, isResolving: isLoading, setBusinessId }
}

/** Full record for the current business (shipbubble pickup settings, banks, store URL). */
const BUSINESS_STALE_TIME = 5 * 60 * 1000
const businessQuery = (id: string) => ({ queryKey: [...queryKeys.business, id] as const, queryFn: () => getBusiness(id), staleTime: BUSINESS_STALE_TIME })

export const useCurrentBusiness = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({ ...businessQuery(businessId ?? ''), enabled: isLive() && Boolean(businessId) })
}

/**
 * The current business for services (wallet, settings, KYC, storefront…). Goes
 * through the shared query cache, so GET business/{id}/ runs once per business
 * however many services ask for it at the same time.
 */
export const fetchCurrentBusiness = () => queryClient.fetchQuery(businessQuery(requireBusinessId()))

const updateBusiness = (patch: UnknownRecord) => apiRequest<unknown>(`business/${requireBusinessId()}/`, { method: 'PATCH', body: patch })

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business })
    },
  })
}

export { updateBusiness }

// ─── Create ─────────────────────────────────────────────────────────────────

export type CreateBusinessInput = {
  name: string
  type: string
  currency: string
  country: string
  state: string
  city: string
  street: string
  phone?: string
  email?: string
  delivery_days?: string[]
  logo?: File | null
}

const createLiveBusiness = async (input: CreateBusinessInput) => {
  const form = new FormData()
  for (const key of ['name', 'type', 'currency', 'country', 'state', 'city', 'street'] as const) form.append(key, input[key])
  if (input.phone) form.append('phone', input.phone)
  if (input.email) form.append('email', input.email)
  input.delivery_days?.forEach(day => form.append('delivery_days', day))
  if (input.logo) form.append('logo', input.logo)
  const response = asRecord(await apiFormRequest<unknown>('business/', 'POST', form))
  return mapBusiness(response.id ? response : response.data)
}

const createMockBusiness = (input: CreateBusinessInput) => {
  const business: Business = {
    ...sampleBusiness(`mock-business-${Date.now()}`, input.name, input.type, input.street, input.city),
    state: input.state,
    country: input.country,
    phone: input.phone ?? '',
    email: input.email ?? '',
    logo: input.logo ? URL.createObjectURL(input.logo) : '',
  }
  mockBusinesses = [...mockBusinesses, business]
  return mockDelay(business, 700)
}

/** POST business/ (multipart, like sink-inventory). Resolves to the new business. */
export const useCreateBusiness = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBusinessInput) => (isLive() ? createLiveBusiness(input) : createMockBusiness(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.businesses }),
  })
}
