import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'
import { useSignupForm } from '../hooks/useSignupForm'
import { AccessTabs, SecurityNote } from './AccessTabs'
import { PhoneField } from './PhoneField'

export function SignupForm() {
  const { register, phone, errors, onSubmit, isSubmitting } = useSignupForm()
  return <form onSubmit={onSubmit} noValidate>
    <AccessTabs mode="signup"/>
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name" placeholder="John" autoComplete="given-name" error={errors.firstname?.message} {...register('firstname')}/>
        <Field label="Last Name" placeholder="Doe" autoComplete="family-name" error={errors.lastname?.message} {...register('lastname')}/>
      </div>
      <PhoneField label="Phone Number" name={phone.name} value={phone.value} onChange={phone.onChange} onBlur={phone.onBlur} placeholder="Enter phone number" error={errors.phone?.message}/>
      <Field label="Email" placeholder="example@email.com" inputMode="email" autoComplete="email" error={errors.email?.message} {...register('email')}/>
      <PasswordField label="Password" placeholder="At least 8 characters" autoComplete="new-password" error={errors.password?.message} {...register('password')}/>
      <PasswordField label="Confirm Password" placeholder="Confirm your password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')}/>
      <Field label="Referral Code (optional)" placeholder="Enter referral code" autoComplete="off" error={errors.referal?.message} {...register('referal')}/>
    </div>
    <Button type="submit" loading={isSubmitting} className="mt-6 w-full py-3.5">Create Account</Button>
    <SecurityNote/>
  </form>
}
