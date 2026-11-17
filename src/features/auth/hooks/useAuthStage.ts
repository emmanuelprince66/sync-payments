import { useLocation, useParams } from 'react-router'
import { paths } from '@/routes/paths'
import { useIsAuthenticated } from '@/stores/auth-store'
import { SETUP_STAGES, STEP_TO_STAGE, type AccessMode, type AuthStage } from '../constants'
import { useSignupStore } from './useSignupStore'

const headings: Record<AuthStage, string> = { access: '', otp: 'Verify OTP', business: 'Set up your business', kyc: 'Verify your business' }

/**
 * Resolves which auth screen to show from the URL, the copy for it, and
 * where to redirect when the user isn't allowed on that step.
 */
export function useAuthStage() {
  const { pathname } = useLocation()
  const { step } = useParams<{ step?: string }>()
  const authenticated = useIsAuthenticated()
  const email = useSignupStore(state => state.draft?.email)

  const mode: AccessMode = pathname.startsWith(paths.signup) ? 'signup' : 'login'
  const stage: AuthStage | undefined = step ? STEP_TO_STAGE[step] : 'access'

  let redirectTo: string | null = null
  if (!stage) redirectTo = paths.signup
  else if ((stage === 'business' || stage === 'kyc') && !authenticated) redirectTo = paths.login
  else if (stage === 'otp' && authenticated) redirectTo = paths.signupBusiness

  const resolved = stage ?? 'access'
  const heading = resolved === 'access' ? (mode === 'login' ? 'Sign in to Sync360 Payments' : 'Start accepting payments') : headings[resolved]
  const setupStep = SETUP_STAGES.indexOf(resolved)
  // Small orange label above the heading (design's .auth-heading > span).
  const eyebrow = resolved === 'access' ? (mode === 'login' ? 'Welcome back' : 'Create your merchant account') : `Account setup · Step ${setupStep + 1} of 3`
  const subtitle = resolved === 'access'
    ? (mode === 'login' ? 'Enter your details to access your business workspace.' : 'Set up your account. You’ll verify your business in the next step.')
    : resolved === 'otp' ? `Enter the 6-digit code sent to ${email || 'your email'}.`
    : resolved === 'business' ? 'This information appears on your invoices and customer checkout.'
    : 'Complete KYC to unlock higher transaction and withdrawal limits.'

  return { mode, stage: resolved, eyebrow, heading, subtitle, redirectTo, setupStep }
}
