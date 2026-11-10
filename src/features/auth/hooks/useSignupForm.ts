import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage, useSignup } from '@/api/auth'
import { paths } from '@/routes/paths'
import { signupSchema, splitName, type SignupFormInput, type SignupFormOutput } from '../schemas'
import { useSignupStore } from './useSignupStore'

export function useSignupForm() {
  const navigate = useNavigate()
  const signup = useSignup()
  const setDraft = useSignupStore(state => state.setDraft)
  const form = useForm<SignupFormInput, unknown, SignupFormOutput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(({ name, phone, email, password }) =>
    signup.mutate({ ...splitName(name), phone, email, password }, {
      onSuccess: () => {
        setDraft({ phone, email, password })
        toast.success(`Verification code sent to ${phone}`)
        navigate(paths.signupVerify)
      },
      onError: error => toast.error(errorMessage(error, 'Unable to create your account')),
    }))

  return { register: form.register, errors: form.formState.errors, onSubmit, isSubmitting: signup.isPending }
}
