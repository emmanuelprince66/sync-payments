import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PasswordField } from '@/components/ui/PasswordField'
import { useLoginForm } from '../hooks/useLoginForm'
import { AccessSwitch, SecurityNote } from './AccessTabs'

export function LoginForm() {
  const { register, errors, onSubmit, isSubmitting, onForgotPassword, remember, setRemember } = useLoginForm()
  return <>
    <form onSubmit={onSubmit} noValidate className="mt-[26px]">
      <div className="flex flex-col gap-[14px]">
        <Field label="Work email" placeholder="you@business.com" autoComplete="username" error={errors.email?.message} {...register('email')}/>
        <PasswordField label="Password" placeholder="Enter your password" autoComplete="current-password" error={errors.password?.message} {...register('password')}/>
      </div>
      {/* Design's .auth-options: keep signed in + forgot password on one row. */}
      <div className="mt-[14px] flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-[9px] font-medium text-[#6D7176]">
          <input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} className="h-3 w-3 accent-[#1367D8]"/>
          Keep me signed in
        </label>
        <button type="button" onClick={onForgotPassword} className="text-[9px] font-bold text-[#FF7F00] hover:underline">Forgot password?</button>
      </div>
      <Button type="submit" icon={isSubmitting ? undefined : 'arrowRight'} loading={isSubmitting} className="mt-[17px] min-h-[38px] w-full flex-row-reverse rounded-lg py-0 text-[11px] font-bold shadow-none">Sign in to dashboard</Button>
    </form>
    <AccessSwitch mode="login"/>
    <SecurityNote/>
  </>
}
