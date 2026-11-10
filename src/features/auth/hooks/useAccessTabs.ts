import { useNavigate } from 'react-router'
import { paths } from '@/routes/paths'
import type { AccessMode } from '../constants'

const ACCESS_OPTIONS: { value: AccessMode; label: string }[] = [
  { value: 'login', label: 'Log in' },
  { value: 'signup', label: 'Create account' },
]

/** Log in / Create account are separate routes; switching tabs replaces the URL. */
export function useAccessTabs() {
  const navigate = useNavigate()
  return {
    options: ACCESS_OPTIONS,
    onChange: (mode: AccessMode) => navigate(mode === 'login' ? paths.login : paths.signup, { replace: true }),
  }
}
