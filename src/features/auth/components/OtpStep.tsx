import { Navigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/ui/OtpInput'
import { useOtpStep } from '../hooks/useOtpStep'

export function OtpStep() {
  const { redirectTo, code, setCode, canSubmit, isSubmitting, canResend, resendLabel, onResend, onSubmit, onChangePhone } = useOtpStep()
  if (redirectTo) return <Navigate to={redirectTo} replace/>

  return <form onSubmit={onSubmit}>
    <OtpInput value={code} onChange={setCode}/>
    <div className="mt-4 text-center text-[11px] text-[#7D8D85]">Didn’t receive it? {canResend
      ? <button type="button" onClick={onResend} className="font-extrabold text-[#438352]">Resend code</button>
      : <span className="font-extrabold text-[#438352]">Resend in {resendLabel}</span>}</div>
    <Button type="submit" loading={isSubmitting} disabled={!canSubmit} className="mt-7 w-full py-3.5">Verify and continue</Button>
    <Button variant="ghost" onClick={onChangePhone} className="mt-2 w-full">Change phone number</Button>
  </form>
}
