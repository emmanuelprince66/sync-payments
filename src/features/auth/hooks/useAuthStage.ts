import { useLocation, useParams } from 'react-router'
import { paths } from '@/routes/paths'
import { useIsAuthenticated } from '@/stores/auth-store'
import { SETUP_STAGES, STEP_TO_STAGE, type AccessMode, type AuthStage } from '../constants'
import { useSignupStore } from './useSignupStore'

const headings: Record<AuthStage, string> = { access: '', otp: 'Verify your phone', business: 'Set up your business', kyc: 'Verify your business' }

/**
 * Resolves which auth screen to show from the URL, the copy for it, and
 * where to redirect when the user isn't allowed on that step.
 */
export function useAuthStage() {
  const { pathname } = useLocation()
  const { step } = useParams<{ step?: string }>()
  const authenticated = useIsAuthenticated()
  const phone = useSignupStore(state => state.draft?.phone)

  const mode: AccessMode = pathname.startsWith(paths.signup) ? 'signup' : 'login'
  const stage: AuthStage | undefined = step ? STEP_TO_STAGE[step] : 'access'

  let redirectTo: string | null = null
  if (!stage) redirectTo = paths.signup
  else if ((stage === 'business' || stage === 'kyc') && !authenticated) redirectTo = paths.login
  else if (stage === 'otp' && authenticated) redirectTo = paths.signupBusiness

  const resolved = stage ?? 'access'
  const heading = resolved === 'access' ? (mode === 'login' ? 'Welcome back' : 'Create your account') : headings[resolved]
  const subtitle = resolved === 'access'
    ? (mode === 'login' ? 'Log in to manage collections, expenses, and payouts.' : 'Start collecting and paying in just a few steps.')
    : resolved === 'otp' ? `We sent a 6-digit code to ${phone || 'your phone number'}.`
    : resolved === 'business' ? 'This information appears on your invoices and customer checkout.'
    : 'Complete KYC to unlock higher transaction and withdrawal limits.'

  return { mode, stage: resolved, heading, subtitle, redirectTo, setupStep: SETUP_STAGES.indexOf(resolved) }
}
