import { useCustomers, type Customer } from '@/api/customers'
import { useDebounce } from '@/hooks/useDebounce'

/** Six digits: enough to be a real prefix, short enough to hit mid-typing. */
const MIN_DIGITS = 6
const digitsOf = (value: string) => value.replace(/\D/g, '')

/**
 * "Is this customer already on file?" while a number is typed (sink's useCustomerPhoneLookup).
 * It only reports matches: overwriting a half-typed record is worse than the duplicate it would prevent.
 */
export function useCustomerPhoneLookup(phone: string, excludeId?: string) {
  const digits = digitsOf(useDebounce(phone, 400))
  const enabled = digits.length >= MIN_DIGITS
  const query = useCustomers({ search: enabled ? digits : '', limit: 5, enabled })
  // The search also covers names and emails; only a real phone match is worth interrupting for.
  const matches: Customer[] = enabled ? (query.data?.customers ?? []).filter(customer => customer.id !== excludeId && digitsOf(customer.phone).includes(digits)) : []
  return { matches, isSearching: enabled && query.isFetching }
}
