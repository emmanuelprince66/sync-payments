import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateCustomer, useUpdateCustomer, type Customer } from '@/api/customers'
import { NIGERIAN_STATES } from '@/lib/nigeria'
import { customerSchema, GENDER_OPTIONS, type CustomerValues } from '../schemas'
import { useCustomerPhoneLookup } from './useCustomerPhoneLookup'
import type { AddressSuggestion } from '@/lib/address'

const toValues = (customer: Customer | null): CustomerValues => ({
  name: customer?.name ?? '',
  phone: customer?.phone ?? '',
  email: customer?.email ?? '',
  gender: customer?.gender === 'MALE' || customer?.gender === 'FEMALE' || customer?.gender === 'OTHER' ? customer.gender : '',
  dateOfBirth: customer?.dateOfBirth ?? '',
  address: customer?.address?.address ?? '',
  addressPhone: customer?.address?.phone ?? '',
  state: customer?.address?.state ?? '',
  city: customer?.address?.city ?? '',
  latitude: customer?.address?.latitude ?? '',
  longitude: customer?.address?.longitude ?? '',
})

/** Sink's add/edit customer form: same fields, rules and payload. Mounted with the dialog, so it opens with the saved values. */
/** A state from an address suggestion → the State list's own name ("Oyo State" → "Oyo"; FCT/Abuja → the list's FCT entry). */
const matchState = (name: string, states: readonly string[]) => {
  const bare = name.replace(/\s+state$/i, '').trim().toLowerCase()
  if (!bare) return ''
  const exact = states.find(item => item.toLowerCase() === bare)
  if (exact) return exact
  if (['fct', 'abuja', 'federal capital territory'].includes(bare)) return states.find(item => /federal|fct|abuja/i.test(item)) ?? ''
  return ''
}

export function useCustomerForm(customer: Customer | null, onClose: (saved?: Customer) => void) {
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const form = useForm<CustomerValues>({ resolver: zodResolver(customerSchema), defaultValues: toValues(customer) })
  const { control, setValue, setError } = form
  const [phone, dateOfBirth, state] = useWatch({ control, name: ['phone', 'dateOfBirth', 'state'] })
  const [street, latitude, longitude] = useWatch({ control, name: ['address', 'latitude', 'longitude'] })
  const clearPin = () => { setValue('latitude', ''); setValue('longitude', '') }
  const lookup = useCustomerPhoneLookup(phone, customer?.id)

  // A saved state the list doesn't know still has to show.
  const stateOptions = [...(state && !NIGERIAN_STATES.includes(state) ? [state] : []), ...NIGERIAN_STATES].map(item => ({ value: item, label: item }))

  return {
    register: form.register,
    errors: form.formState.errors,
    isEditing: Boolean(customer),
    isSubmitting: create.isPending || update.isPending,
    genderOptions: customer ? [{ value: '', label: 'Not specified' }, ...GENDER_OPTIONS] : GENDER_OPTIONS,
    dateOfBirth,
    setDateOfBirth: (value: string) => setValue('dateOfBirth', value, { shouldDirty: true }),
    stateOptions,
    /** sink's customer address search: a pick fills street, state and city and pins the point; typing drops the pin. */
    addressField: {
      value: street,
      isPinned: Boolean(latitude && longitude),
      onChange: (value: string) => { setValue('address', value, { shouldDirty: true }); if (latitude || longitude) clearPin() },
      onSelect: (suggestion: AddressSuggestion) => {
        setValue('address', suggestion.address || suggestion.label, { shouldDirty: true, shouldValidate: true })
        const matched = matchState(suggestion.state, NIGERIAN_STATES)
        if (matched) setValue('state', matched, { shouldDirty: true })
        if (suggestion.city) setValue('city', suggestion.city, { shouldDirty: true })
        setValue('latitude', suggestion.latitude)
        setValue('longitude', suggestion.longitude)
      },
    },
    /** State and city edited by hand also drop the pin (the backend then has no wrong point to keep). */
    registerLocation: (name: 'state' | 'city') => form.register(name, { onChange: clearPin }),
    phoneMatches: lookup.matches,
    isCheckingPhone: lookup.isSearching,
    /** Copies an existing customer's details onto the form, only on request. */
    fillFrom: (match: Customer) => {
      const values = toValues(match)
      for (const key of Object.keys(values) as (keyof CustomerValues)[]) if (values[key]) setValue(key, values[key] as never, { shouldValidate: key === 'name' || key === 'phone' })
    },
    onSubmit: form.handleSubmit(async values => {
      const street = values.address.trim()
      // The backend requires a street once any address is sent.
      if ((values.city.trim() || values.state) && !street) return setError('address', { message: 'Street address is required when city/state is set' })
      if (customer?.address && !street) return setError('address', { message: 'The customer’s default address cannot be blank' })
      const input = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        address: street
          ? { address: street, city: values.city.trim(), state: values.state, country: customer?.address?.country || 'Nigeria', phone: values.addressPhone.trim(), isDefault: customer?.address ? customer.address.isDefault : true, latitude: values.latitude, longitude: values.longitude }
          : undefined,
      }
      try {
        if (customer) {
          await update.mutateAsync({ id: customer.id, input })
          toast.success('Customer updated')
          onClose()
        } else {
          const saved = await create.mutateAsync(input)
          toast.success('Customer added')
          onClose(saved)
        }
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save this customer.'))
      }
    }),
  }
}
