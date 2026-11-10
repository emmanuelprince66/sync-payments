import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateBusiness, type Business } from '@/api/business'
import { NIGERIAN_STATES } from '@/lib/nigeria'
import { BUSINESS_TYPES, CURRENCIES, DEFAULT_COUNTRY } from '../constants'
import { createBusinessSchema, toE164, type CreateBusinessFormValues } from '../schemas'
import { useBusinessLogo } from './useBusinessLogo'

const defaults: CreateBusinessFormValues = {
  name: '', type: BUSINESS_TYPES[0], currency: 'NGN', country: DEFAULT_COUNTRY, state: 'Lagos', city: '', street: '', phone: '', email: '',
}

/** Create-business form (sink-inventory's fields). Calls onCreated with the new business. */
export function useCreateBusinessForm({ onCreated }: { onCreated: (business: Business) => void }) {
  const create = useCreateBusiness()
  const logo = useBusinessLogo()
  const form = useForm<CreateBusinessFormValues>({ resolver: zodResolver(createBusinessSchema), defaultValues: defaults })

  const onSubmit = form.handleSubmit(values => create.mutate(
    { ...values, phone: toE164(values.phone), email: values.email || undefined, logo: logo.file },
    {
      onSuccess: business => {
        toast.success(`${business.name || values.name} is ready`)
        form.reset(defaults)
        logo.reset()
        onCreated(business)
      },
      onError: error => toast.error(errorMessage(error, 'Unable to create your business')),
    },
  ))

  const reset = () => {
    form.reset(defaults)
    logo.reset()
  }

  return {
    register: form.register,
    errors: form.formState.errors,
    onSubmit,
    reset,
    isSubmitting: create.isPending,
    logo,
    options: { types: BUSINESS_TYPES, currencies: CURRENCIES, states: NIGERIAN_STATES },
  }
}
