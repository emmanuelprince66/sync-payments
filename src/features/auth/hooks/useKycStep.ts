import { useNavigate } from 'react-router'
import { paths } from '@/routes/paths'
import { KYC_BENEFITS } from '../constants'

export function useKycStep() {
  const navigate = useNavigate()
  return {
    benefits: KYC_BENEFITS,
    /** The same verification the app links to everywhere; the business was just created and selected. */
    startKyc: () => navigate(paths.kyc, { replace: true }),
    finish: () => navigate(paths.dashboard, { replace: true }),
  }
}
