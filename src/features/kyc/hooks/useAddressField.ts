import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { env } from '@/config/env'
import { useDebounce } from '@/hooks/useDebounce'
import type { Kyc } from './useKyc'

/**
 * Tier 3's residential address. sink-inventory resolves it through a
 * server-side Geoapify autocomplete (Nigeria only) so the city and state come
 * from a real place. This app has no server, so it calls Geoapify directly when
 * VITE_GEOAPIFY_KEY is set (Geoapify keys are browser keys, restrict them by
 * domain); without a key the merchant types the address and picks the state.
 */
const GEOAPIFY_KEY = env.geoapifyKey

export type AddressSuggestion = { id: string; label: string; address: string; city: string; state: string }

type GeoapifyFeature = { properties?: Record<string, unknown> }

const text = (value: unknown) => (typeof value === 'string' ? value : '')

/** "Lagos State" → "Lagos", "Federal Capital Territory" → "FCT - Abuja" (the names sink sends). */
const normalizeState = (value: string) => {
  if (/federal capital|^fct|abuja/i.test(value)) return 'FCT - Abuja'
  return value.replace(/\s+state$/i, '').trim()
}

const toSuggestion = (feature: GeoapifyFeature, index: number): AddressSuggestion => {
  const p = feature.properties ?? {}
  const street = [text(p.housenumber), text(p.street)].filter(Boolean).join(' ') || text(p.address_line1) || text(p.name)
  return {
    id: text(p.place_id) || String(index),
    label: text(p.formatted) || street,
    address: street || text(p.formatted),
    city: text(p.city) || text(p.town) || text(p.village) || text(p.suburb),
    state: normalizeState(text(p.state)),
  }
}

const fetchSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
  url.searchParams.set('text', query)
  url.searchParams.set('apiKey', GEOAPIFY_KEY)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('limit', '6')
  url.searchParams.set('filter', 'countrycode:ng')
  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('Address lookup failed')
  const data = (await response.json()) as { features?: GeoapifyFeature[] }
  return (data.features ?? []).map(toSuggestion)
}

export function useAddressField(kyc: Kyc) {
  const form = kyc.individualForm
  const mode: 'autocomplete' | 'manual' = GEOAPIFY_KEY ? 'autocomplete' : 'manual'
  const [query, setQuery] = useState(form.getValues('address') ?? '')
  const [open, setOpen] = useState(false)
  const [hasCoordinates, setHasCoordinates] = useState(false)
  const debounced = useDebounce(query.trim(), 300)

  const suggestions = useQuery({
    queryKey: ['kyc', 'address', debounced],
    queryFn: () => fetchSuggestions(debounced),
    enabled: mode === 'autocomplete' && open && debounced.length >= 3,
    staleTime: 5 * 60 * 1000,
  })

  return {
    mode,
    query,
    open: open && mode === 'autocomplete' && debounced.length >= 3,
    suggestions: suggestions.data ?? [],
    searching: suggestions.isFetching,
    hasCoordinates,
    /** Typing invalidates a picked suggestion, so the city and state that came with it are dropped. */
    type: (value: string) => {
      setQuery(value)
      setOpen(true)
      form.setValue('address', value)
      if (mode === 'autocomplete') {
        setHasCoordinates(false)
        form.setValue('city', '')
        form.setValue('state', '')
      }
    },
    choose: (suggestion: AddressSuggestion) => {
      setQuery(suggestion.address || suggestion.label)
      setOpen(false)
      form.setValue('address', suggestion.address || suggestion.label)
      form.setValue('city', suggestion.city)
      form.setValue('state', suggestion.state)
      form.clearErrors(['address', 'state'])
      setHasCoordinates(true)
    },
    close: () => setOpen(false),
  }
}
