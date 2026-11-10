import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'
import { useSignupForm } from '../hooks/useSignupForm'
import { AccessTabs, SecurityNote } from './AccessTabs'

export function SignupForm() {
  const { register, errors, onSubmit, isSubmitting } = useSignupForm()
  return <form onSubmit={onSubmit} noValidate>
    <AccessTabs mode="signup"/>
    <div className="mt-6 space-y-4">
      <Field label="Your full name" placeholder="e.g. Kemi Adeyemi" autoComplete="name" error={errors.name?.message} {...register('name')}/>
      <Field label="Phone number" type="tel" placeholder="0802 000 0000" autoComplete="tel" error={errors.phone?.message} {...register('phone')}/>
      <Field label="Email address" type="email" placeholder="you@business.com" autoComplete="email" error={errors.email?.message} {...register('email')}/>
      <PasswordField label="Password" placeholder="Create a password" autoComplete="new-password" hint="At least 8 characters" error={errors.password?.message} {...register('password')}/>
    </div>
    <Button type="submit" loading={isSubmitting} className="mt-6 w-full py-3.5">Send verification code</Button>
    <SecurityNote/>
  </form>
}
