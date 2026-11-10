import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage, useLogin } from '@/api/auth'
import { paths } from '@/routes/paths'
import { loginSchema, type LoginFormInput, type LoginFormOutput } from '../schemas'

export function useLoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const queryClient = useQueryClient()
  const form = useForm<LoginFormInput, unknown, LoginFormOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(values => login.mutate(values, {
    onSuccess: () => {
      toast.success('Welcome back')
      // Nothing cached for a previous session may show; the user picks a business next.
      queryClient.clear()
      const from = (location.state as { from?: string } | null)?.from
      navigate(paths.selectBusiness, { replace: true, state: { from: from && from !== paths.login ? from : undefined } })
    },
    onError: error => toast.error(errorMessage(error, 'Unable to log in')),
  }))

  return {
    register: form.register,
    errors: form.formState.errors,
    onSubmit,
    isSubmitting: login.isPending,
    onForgotPassword: () => toast.info('Password reset is coming soon'),
  }
}
