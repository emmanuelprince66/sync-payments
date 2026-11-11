import { zodResolver } from '@hookform/resolvers/zod'
import { useController, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage, useSignup } from '@/api/auth'
import { paths } from '@/routes/paths'
import { signupSchema, type SignupFormValues } from '../schemas'
import { useSignupStore } from './useSignupStore'

/** Sign-up step: same fields, rules and payload as sink-inventory (POST auth/signup/). */
export function useSignupForm() {
  const navigate = useNavigate()
  const signup = useSignup()
  const setDraft = useSignupStore(state => state.setDraft)
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstname: '', lastname: '', phone: '', email: '', password: '', confirmPassword: '', referal: '' },
    mode: 'onChange',
  })
  const { field: phone } = useController({ control: form.control, name: 'phone' })

  const onSubmit = form.handleSubmit(values => {
    const referal = values.referal?.trim()
    const payload = {
      firstname: values.firstname,
      lastname: values.lastname,
      phone: values.phone,
      email: values.email,
      password: values.password,
      // Backend `referal` has minLength 1, so only send it when set.
      ...(referal ? { referal } : {}),
    }
    signup.mutate(payload, {
      onSuccess: () => {
        setDraft({ phone: values.phone, email: values.email, password: values.password })
        toast.success('Signup successful! Check your email for the OTP, valid for 10 minutes.')
        navigate(paths.signupVerify)
      },
      onError: error => toast.error(errorMessage(error, 'Unable to create your account')),
    })
  })

  return { register: form.register, phone, errors: form.formState.errors, onSubmit, isSubmitting: signup.isPending }
}
