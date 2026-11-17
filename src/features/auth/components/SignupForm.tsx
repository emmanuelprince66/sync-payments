import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'
import { useSignupForm } from '../hooks/useSignupForm'
import { AccessSwitch, ConsentNote, SecurityNote } from './AccessTabs'
import { PhoneField } from './PhoneField'

export function SignupForm() {
  const { register, phone, errors, onSubmit, isSubmitting } = useSignupForm()
  return <>
    <form onSubmit={onSubmit} noValidate className="mt-[26px]">
      <div className="space-y-[14px]">
        <div className="grid grid-cols-1 gap-[14px] min-[400px]:grid-cols-2 min-[400px]:gap-2.5">
          <Field label="First Name" placeholder="John" autoComplete="given-name" error={errors.firstname?.message} {...register('firstname')}/>
          <Field label="Last Name" placeholder="Doe" autoComplete="family-name" error={errors.lastname?.message} {...register('lastname')}/>
        </div>
        <PhoneField label="Phone Number" name={phone.name} value={phone.value} onChange={phone.onChange} onBlur={phone.onBlur} placeholder="Enter phone number" error={errors.phone?.message}/>
        <Field label="Email" placeholder="example@email.com" inputMode="email" autoComplete="email" error={errors.email?.message} {...register('email')}/>
        <PasswordField label="Password" placeholder="At least 8 characters" autoComplete="new-password" error={errors.password?.message} {...register('password')}/>
        <PasswordField label="Confirm Password" placeholder="Confirm your password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')}/>
        <Field label="Referral Code (optional)" placeholder="Enter referral code" autoComplete="off" error={errors.referal?.message} {...register('referal')}/>
        <ConsentNote/>
      </div>
      <Button type="submit" icon={isSubmitting ? undefined : 'arrowRight'} loading={isSubmitting} className="mt-4 flex-row-reverse min-h-[38px] w-full rounded-lg py-0 text-[11px] font-bold shadow-none">Create Account</Button>
    </form>
    <AccessSwitch mode="signup"/>
    <SecurityNote/>
  </>
}
