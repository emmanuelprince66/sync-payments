import { Navigate } from 'react-router'
import { AuthLayout } from './components/AuthLayout'
import { BusinessStep } from './components/BusinessStep'
import { KycStep } from './components/KycStep'
import { LoginForm } from './components/LoginForm'
import { OtpStep } from './components/OtpStep'
import { SignupForm } from './components/SignupForm'
import { usePreloadAppShell } from '@/routes/usePreloadAppShell'
import { useAuthStage } from './hooks/useAuthStage'

/** Serves /login, /signup and the onboarding steps /signup/verify|business|kyc. */
export default function AuthPage() {
  const { mode, stage, heading, subtitle, redirectTo, setupStep } = useAuthStage()
  usePreloadAppShell()
  if (redirectTo) return <Navigate to={redirectTo} replace/>

  return <AuthLayout setupStep={setupStep} heading={heading} subtitle={subtitle} centered={stage === 'access'}>
    {stage === 'access' && (mode === 'login' ? <LoginForm/> : <SignupForm/>)}
    {stage === 'otp' && <OtpStep/>}
    {stage === 'business' && <BusinessStep/>}
    {stage === 'kyc' && <KycStep/>}
  </AuthLayout>
}
