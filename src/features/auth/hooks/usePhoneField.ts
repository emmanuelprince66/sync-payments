import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { useState } from 'react'
import { DEFAULT_PHONE_COUNTRY } from '../constants'

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

/** Every country with its dialling code, e.g. { value: "NG", label: "+234 Nigeria" }, sorted by name. */
const COUNTRY_OPTIONS = getCountries()
  .map(code => ({ code, name: regionNames.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(({ code, name }) => ({ value: code, label: `+${getCountryCallingCode(code)} ${name}` }))

/** "+234" + "0803 123 4567" → "+2348031234567" (international format, like sink-inventory's PhoneInput). */
const toInternational = (country: CountryCode, national: string) => {
  const digits = national.replace(/\D/g, '')
  if (!digits) return ''
  return parsePhoneNumberFromString(digits, country)?.number ?? `+${getCountryCallingCode(country)}${digits}`
}

type PhoneFieldBinding = { value?: string; onChange: (value: string) => void }

/**
 * State for a phone input with a country-code picker. The form value is always the
 * full international number ("+2348031234567"), or "" while the number is empty.
 */
export function usePhoneField({ value, onChange }: PhoneFieldBinding) {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined
  const [country, setCountry] = useState<CountryCode>(parsed?.country ?? DEFAULT_PHONE_COUNTRY)
  const [national, setNational] = useState(parsed?.nationalNumber ?? '')

  return {
    countries: COUNTRY_OPTIONS,
    country,
    national,
    onCountryChange: (next: string) => {
      setCountry(next as CountryCode)
      onChange(toInternational(next as CountryCode, national))
    },
    onNationalChange: (next: string) => {
      setNational(next)
      onChange(toInternational(country, next))
    },
  }
}
