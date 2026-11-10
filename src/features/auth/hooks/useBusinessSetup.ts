import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateBusiness } from '@/api/business'
import { NIGERIAN_STATES } from '@/lib/nigeria'
import { BUSINESS_TYPES, DEFAULT_COUNTRY } from '@/features/business/constants'
import { useActivateBusiness } from '@/features/business/hooks/useActivateBusiness'
import { useBusinessLogo } from '@/features/business/hooks/useBusinessLogo'
import { paths } from '@/routes/paths'
import { businessSchema, type BusinessFormValues } from '../schemas'

/**
 * Splits the one-line signup address into what POST business/ needs.
 * "22 Awolowo Road, Ikoyi, Lagos" → street "22 Awolowo Road", city "Ikoyi", state "Lagos".
 * The state is the Nigerian state named in the address (Lagos if none); the full
 * address can be refined later in Settings.
 */
const splitAddress = (address: string) => {
  const parts = address.split(',').map(part => part.trim()).filter(Boolean)
  const state = NIGERIAN_STATES.find(name => parts.some(part => part.toLowerCase().includes(name.toLowerCase()))) ?? 'Lagos'
  const rest = parts.filter(part => !part.toLowerCase().includes(state.toLowerCase()))
  const street = rest[0] ?? address.trim()
  const city = rest.length > 1 ? rest[rest.length - 1] : state
  return { street, city, state }
}

/** Signup "Set up your business" step: creates the business (POST business/) and selects it. */
export function useBusinessSetup() {
  const navigate = useNavigate()
  const create = useCreateBusiness()
  const activate = useActivateBusiness()
  const logo = useBusinessLogo()
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: { name: '', category: BUSINESS_TYPES[0], address: '' },
  })

  const onSubmit = form.handleSubmit(({ name, category, address }) => create.mutate(
    { name, type: category, currency: 'NGN', country: DEFAULT_COUNTRY, ...splitAddress(address), logo: logo.file },
    {
      onSuccess: business => {
        activate(business)
        navigate(paths.signupKyc)
      },
      onError: error => toast.error(errorMessage(error, 'Unable to create your business')),
    },
  ))

  return {
    register: form.register,
    errors: form.formState.errors,
    categories: BUSINESS_TYPES,
    logo: logo.preview,
    onLogoFile: logo.pick,
    onSubmit,
    isSubmitting: create.isPending,
    isReady: true,
  }
}
