import { useNavigate } from 'react-router'
import { useComplianceStatus } from '@/api/compliance'
import { CORPORATE_TIERS, INDIVIDUAL_TIERS } from '@/features/kyc/tiers'
import { paths } from '@/routes/paths'

/** Where the business stands. Every action leads to the KYC flow, the one place anything is filed. */
export function useCompliancePage() {
  const navigate = useNavigate()
  const status = useComplianceStatus()
  const tiers = status.isCorporate ? CORPORATE_TIERS : INDIVIDUAL_TIERS

  return {
    ...status,
    rungs: tiers.map(tier => ({ tier: tier.tier, title: tier.title, limit: tier.limit, done: status.tier >= tier.tier })),
    actionLabel: status.complete ? 'View verification' : status.hasStarted ? 'Continue verification' : 'Start verification',
    goToKyc: () => navigate(paths.kyc),
  }
}

export type ComplianceModel = ReturnType<typeof useCompliancePage>
