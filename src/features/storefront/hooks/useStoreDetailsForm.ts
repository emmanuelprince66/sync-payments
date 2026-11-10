import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { BUSINESS_SECTOR_OPTIONS, CURRENCY_OPTIONS, useSaveStorefront, type StorefrontProfile } from '@/api/storefront'
import { storeDetailsSchema, type StoreDetailsValues } from '../schemas'

const pick = <T extends string>(options: readonly T[], value: string, fallback: T) => (options as readonly string[]).includes(value) ? (value as T) : fallback

const toValues = (profile: StorefrontProfile): StoreDetailsValues => ({
  name: profile.name,
  sector: pick(BUSINESS_SECTOR_OPTIONS, profile.sector, 'Minimart & Retail'),
  tagline: profile.tagline,
  description: profile.description,
  phone: profile.phone,
  whatsapp: profile.whatsapp,
  email: profile.email,
  street: profile.street,
  city: profile.city,
  state: profile.state,
  country: profile.country,
  zipCode: profile.zipCode,
  currency: pick(CURRENCY_OPTIONS, profile.currency, 'NGN'),
})

/** Store details and contact channels (name, sector, tagline, about, phone/WhatsApp/email, address, currency). */
export function useStoreDetailsForm(profile: StorefrontProfile) {
  const save = useSaveStorefront()
  const form = useForm<StoreDetailsValues>({
    resolver: zodResolver(storeDetailsSchema),
    // `values` keeps the form in sync when the profile refetches after a save.
    values: toValues(profile),
    resetOptions: { keepDirtyValues: true },
    mode: 'onBlur',
  })

  const onSubmit = form.handleSubmit(values =>
    save.mutate(values, {
      onSuccess: () => { toast.success('Store details saved'); form.reset(values) },
      onError: error => toast.error(errorMessage(error)),
    }))

  return {
    register: form.register,
    errors: form.formState.errors,
    dirty: form.formState.isDirty,
    reset: () => form.reset(toValues(profile)),
    onSubmit,
    saving: save.isPending,
    sectors: BUSINESS_SECTOR_OPTIONS,
    currencies: CURRENCY_OPTIONS,
  }
}
