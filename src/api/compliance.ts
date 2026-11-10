import { useCurrentBusiness } from './business'
import { kycProgress, useCorporateReview, useKycStatus } from './kyc'

/**
 * Verification standing, from the same reads as the KYC flow (api/kyc.ts):
 *  GET business/{id}/                            business details
 *  GET wallet/{bank_id}/                         tier, nin, bvn, address, account_type, wallet_details
 *  GET wallet/upgrade_corporate_account/{bank}/  company documents and their review (404 means none)
 * Nothing is submitted here: identity, documents and directors are all filed through the KYC flow.
 */

export type ComplianceState = 'done' | 'action' | 'review' | 'rejected'

export type ComplianceItem = {
  id: 'business' | 'identity' | 'documents' | 'address' | 'settlement'
  title: string
  description: string
  state: ComplianceState
  /** What is on file, in one line. */
  detail: string
  /** False for what KYC doesn't cover (the business profile), which has nothing to file here. */
  viaKyc: boolean
}

const maskAccount = (number: string) => (number ? `•••• ${number.slice(-4)}` : '')

export const useComplianceStatus = () => {
  const business = useCurrentBusiness()
  const kyc = useKycStatus()
  const corporate = useCorporateReview()
  const record = business.data
  const account = kyc.data
  const review = corporate.data
  const isCorporate = account?.accountType === 'corporate'
  const address = [record?.street, record?.city].filter(Boolean).join(', ')
  const onFile = [account?.hasNin && 'NIN', account?.hasBvn && 'BVN'].filter(Boolean).join(' and ')

  const items: ComplianceItem[] = [
    {
      id: 'business',
      title: 'Business profile',
      description: 'Legal name, address and contact on your business record',
      state: record?.name ? 'done' : 'action',
      detail: [record?.name, address || 'No address on file', record?.email || record?.phone].filter(Boolean).join(' · '),
      viaKyc: false,
    },
    isCorporate
      ? {
        id: 'identity',
        title: 'Director & business details',
        description: 'Tier 1: the primary director, BVN and CAC registration',
        state: account?.corporateCompletedTiers.includes(1) ? 'done' : 'action',
        detail: account?.corporateCompletedTiers.includes(1) ? 'Accepted at Tier 1' : 'Not submitted yet',
        viaKyc: true,
      }
      : {
        id: 'identity',
        title: 'Identity verification',
        description: 'Tiers 1 and 2: your NIN and BVN',
        state: account?.hasNin && account?.hasBvn ? 'done' : 'action',
        detail: onFile ? `${onFile} on file` : 'Neither NIN nor BVN on file yet',
        viaKyc: true,
      },
    isCorporate
      ? {
        id: 'documents',
        title: 'Company documents & directors',
        description: 'Tier 2: TIN, CAC filings and a record for every director',
        state: review?.isApproved || account?.corporateCompletedTiers.includes(2) ? 'done' : review?.isPending ? 'review' : review?.isRejected ? 'rejected' : 'action',
        detail: review?.isApproved || account?.corporateCompletedTiers.includes(2) ? 'Approved' : review?.isPending ? `With our review team · ${review.directors.length} ${review.directors.length === 1 ? 'director' : 'directors'}` : review?.isRejected ? 'Sent back: check your email and file again' : 'Not submitted yet',
        viaKyc: true,
      }
      : {
        id: 'address',
        title: 'Residential address',
        description: 'Tier 3: the address behind your account',
        state: account?.hasAddress ? 'done' : 'action',
        detail: account?.hasAddress ? 'Address on file' : 'Not submitted yet',
        viaKyc: true,
      },
    {
      id: 'settlement',
      title: 'Settlement account',
      description: 'Opens automatically once your first tier is accepted',
      state: account?.wallet ? 'done' : 'action',
      detail: account?.wallet ? `${account.wallet.bank_name} ${maskAccount(account.wallet.account_number)}` : 'No account yet',
      viaKyc: true,
    },
  ]

  const { percent, complete } = kycProgress(account)
  return {
    items,
    percent,
    complete,
    tier: account?.tier ?? 0,
    tierLabel: account?.tierLabel ?? null,
    isCorporate,
    hasStarted: account?.hasStarted ?? false,
    isLoading: business.isLoading || kyc.isLoading,
    isError: business.isError || kyc.isError,
  }
}
