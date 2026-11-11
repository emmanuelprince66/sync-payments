import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage, useLogin, useVerifyPhone } from '@/api/auth'
import { paths } from '@/routes/paths'
import { OTP_LENGTH, RESEND_SECONDS } from '../constants'
import { useResendTimer } from './useResendTimer'
import { useSignupStore } from './useSignupStore'

/** Verifies the phone code, then signs in with the signup credentials so onboarding can continue. */
export function useOtpStep() {
  const navigate = useNavigate()
  const draft = useSignupStore(state => state.draft)
  const clearDraft = useSignupStore(state => state.clear)
  const verify = useVerifyPhone()
  const login = useLogin()
  const [code, setCode] = useState('')
  const isComplete = code.length === OTP_LENGTH
  const timer = useResendTimer(RESEND_SECONDS)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return
    if (!isComplete) { toast.error('Please enter a valid 6-digit OTP'); return }
    verify.mutate({ token: code, phone: draft.phone }, {
      onSuccess: () => login.mutate({ email: draft.email, password: draft.password }, {
        onSuccess: () => { clearDraft(); toast.success('Account verified successfully!'); navigate(paths.signupBusiness, { replace: true }) },
        onError: error => { toast.error(errorMessage(error, 'Verified, but we could not sign you in. Please log in.')); navigate(paths.login, { replace: true }) },
      }),
      onError: error => toast.error(errorMessage(error, 'Invalid code. Please try again.')),
    })
  }

  const onResend = () => {
    if (!draft) return
    toast.success('OTP resent successfully!')
    timer.restart()
  }

  return {
    /** No signup in progress (e.g. page refreshed): send the user back to signup. */
    redirectTo: draft ? null : paths.signup,
    code,
    setCode,
    canSubmit: isComplete,
    isSubmitting: verify.isPending || login.isPending,
    canResend: timer.canResend,
    resendLabel: timer.label,
    onResend,
    onSubmit,
    onChangePhone: () => navigate(paths.signup),
  }
}
