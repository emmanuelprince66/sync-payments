import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'
import { useLoginForm } from '../hooks/useLoginForm'
import { AccessTabs, SecurityNote } from './AccessTabs'

export function LoginForm() {
  const { register, errors, onSubmit, isSubmitting, onForgotPassword } = useLoginForm()
  return <form onSubmit={onSubmit} noValidate>
    <AccessTabs mode="login"/>
    <div className="mt-6 space-y-4">
      <Field label="Email or phone number" placeholder="you@business.com" autoComplete="username" error={errors.email?.message} {...register('email')}/>
      <PasswordField label="Password" placeholder="Enter your password" autoComplete="current-password" error={errors.password?.message} {...register('password')}/>
    </div>
    <div className="mb-2 mt-3 text-right"><button type="button" onClick={onForgotPassword} className="text-[11px] font-extrabold text-[#438352]">Forgot password?</button></div>
    <Button type="submit" loading={isSubmitting} className="mt-6 w-full py-3.5">Log in to Sync360 Payments</Button>
    <SecurityNote/>
  </form>
}
