import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useCorporateReview, useKycStatus } from '@/api/kyc'
import { bnplErrorMessage, useSetBnpl } from '@/api/storefront'
import { paths } from '@/routes/paths'
import { bnplEligibility, ENFORCE_CORPORATE_APPROVAL, MIN_BNPL_TIER } from '../eligibility'

/**
 * Akawopay setup, as in sink-inventory's BnplCard:
 * - `active` is server state (business.enable_bnpl), never local.
 * - Turning it ON is an agreement, so it goes through the terms modal; turning it OFF is immediate.
 * - Eligibility (activated wallet + KYC tier, or approved corporate documents) is shown before the switch.
 * - Field-keyed backend errors (`enable_bnpl: "..."`) are shown verbatim in the modal and as a toast.
 */
export function useBnplSetup(active: boolean) {
  const navigate = useNavigate()
  const kyc = useKycStatus()
  const status = kyc.data
  const corporate = useCorporateReview()
  const mutation = useSetBnpl()
  const [modalOpen, setModalOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [apiError, setApiError] = useState('')

  const { ready, reason } = bnplEligibility({
    // sink: a wallet must exist before BNPL can be offered.
    walletLive: Boolean(status?.wallet),
    tier: status?.tier ?? 0,
    accountType: status?.accountType ?? null,
    corporateApproved: ENFORCE_CORPORATE_APPROVAL ? Boolean(corporate.data?.isApproved) : false,
  })

  const closeModal = () => { setModalOpen(false); setAgreed(false); setApiError('') }

  const save = (enabled: boolean) => {
    setApiError('')
    mutation.mutate(enabled, {
      onSuccess: () => {
        toast.success(enabled ? 'Buy Now Pay Later is now active.' : 'Buy Now Pay Later has been turned off.')
        closeModal()
      },
      onError: error => {
        const message = bnplErrorMessage(error)
        toast.error(message)
        setApiError(message)
      },
    })
  }

  return {
    active,
    ready,
    reason,
    minTier: MIN_BNPL_TIER,
    checking: kyc.isLoading,
    saving: mutation.isPending,
    /** Card switch: ON opens the terms, OFF saves straight away. */
    toggle: (checked: boolean) => (checked ? setModalOpen(true) : save(false)),
    learnMore: () => setModalOpen(true),
    goToVerification: () => { closeModal(); navigate(paths.kyc) },
    modal: {
      open: modalOpen,
      close: closeModal,
      agreed,
      setAgreed,
      apiError,
      activate: () => { if (agreed) save(true) },
    },
  }
}
