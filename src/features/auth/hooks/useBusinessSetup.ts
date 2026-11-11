import { zodResolver } from '@hookform/resolvers/zod'
import { useController, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateBusiness } from '@/api/business'
import { BUSINESS_TYPES } from '@/features/business/constants'
import { useActivateBusiness } from '@/features/business/hooks/useActivateBusiness'
import { useBusinessLogo } from '@/features/business/hooks/useBusinessLogo'
import { paths } from '@/routes/paths'
import { DELIVERY_DAYS, SIGNUP_CURRENCIES } from '../constants'
import { businessSchema, type BusinessFormValues } from '../schemas'

/**
 * Signup "Set up your business" step: same fields, rules and multipart payload as
 * sink-inventory's create-business form (POST business/), then selects the new business.
 */
export function useBusinessSetup() {
  const navigate = useNavigate()
  const create = useCreateBusiness()
  const activate = useActivateBusiness()
  const logo = useBusinessLogo()
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: { name: '', type: '', currency: '', country: '', state: '', city: '', street: '', phone: '', email: '', delivery_days: [] },
  })
  const { field: phone } = useController({ control: form.control, name: 'phone' })
  const { field: deliveryDays } = useController({ control: form.control, name: 'delivery_days' })

  const toggleDay = (day: string) => {
    const selected = new Set(deliveryDays.value)
    if (selected.has(day)) selected.delete(day)
    else selected.add(day)
    deliveryDays.onChange(Array.from(selected))
  }

  const onSubmit = form.handleSubmit(values => create.mutate(
    {
      name: values.name,
      type: values.type,
      currency: values.currency,
      country: values.country,
      state: values.state,
      city: values.city,
      street: values.street,
      phone: values.phone || undefined,
      email: values.email || undefined,
      delivery_days: values.delivery_days,
      logo: logo.file,
    },
    {
      onSuccess: business => {
        toast.success('Business Created Successfully')
        activate(business)
        navigate(paths.signupKyc)
      },
      onError: error => toast.error(errorMessage(error, "Couldn't create your business. Please try again.")),
    },
  ))

  return {
    register: form.register,
    errors: form.formState.errors,
    types: BUSINESS_TYPES,
    currencies: SIGNUP_CURRENCIES,
    phone,
    days: DELIVERY_DAYS,
    selectedDays: deliveryDays.value,
    toggleDay,
    logo: logo.preview,
    logoAccept: logo.accept,
    logoMaxMb: logo.maxMb,
    onLogoFile: logo.pick,
    onLogoClear: logo.reset,
    onSubmit,
    isSubmitting: create.isPending,
  }
}
