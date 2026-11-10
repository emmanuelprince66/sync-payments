import { useNavigate } from 'react-router'
import { paths } from '@/routes/paths'
import { useState } from 'react'
import type { AccountType } from '@/api/kyc'
import { CORPORATE_TIERS, INDIVIDUAL_TIERS, type KycTier } from '../tiers'
import { useKyc } from './useKyc'

export const ACCOUNT_TYPES: { value: AccountType; title: string; blurb: string; icon: 'user' | 'building'; tiers: KycTier[] }[] = [
  { value: 'individual', title: 'Individual account', blurb: 'For sole traders and personal settlements.', icon: 'user', tiers: INDIVIDUAL_TIERS },
  { value: 'corporate', title: 'Corporate account', blurb: 'For CAC-registered businesses with directors.', icon: 'building', tiers: CORPORATE_TIERS },
]

/**
 * The KYC screen's state (sink's KycConfirm): the account-type chooser, which
 * flow is showing, and the heading copy. An account that has already been
 * opened supplies its own type, so the chooser is skipped.
 */
export function useKycPage() {
  const navigate = useNavigate()
  const kyc = useKyc()
  const { verification } = kyc

  // Set only when the merchant picks a type on this screen.
  const [picked, setPicked] = useState<AccountType | null>(null)
  const [selection, setSelection] = useState<AccountType>('individual')

  const resumedType: AccountType | null = verification.hasStarted ? (verification.accountType ?? 'individual') : null
  const activeType = picked ?? resumedType
  /** Opening a corporate account on top of an individual one. */
  const isUpgrading = activeType === 'corporate' && resumedType === 'individual'
  const chosen = ACCOUNT_TYPES.find(type => type.value === activeType) ?? null

  const headline = !chosen
    ? 'Verify your identity'
    : isUpgrading
      ? 'Upgrade to a corporate account'
      : verification.hasStarted
        ? 'Continue verification'
        : chosen.title

  const subhead = !chosen
    ? 'CBN regulations require every Sync360 merchant to verify their identity before receiving settlements. Pick the account type that matches your business.'
    : isUpgrading
      ? "Your individual verification stays as it is while we review the company's documents."
      : verification.hasStarted
        ? 'Pick up where you left off. Each tier builds on the one before it, and you can stop at any point.'
        : 'Complete a tier to raise your daily limit. Each tier builds on the one before it, and you can stop at any point.'

  return {
    /** Leave the page: back where the user came from, or to Compliance. */
    exit: () => (window.history.length > 1 ? navigate(-1) : navigate(paths.compliance)),
    kyc,
    loading: verification.isLoading && !chosen,
    chosen,
    selection,
    setSelection,
    confirmSelection: () => setPicked(selection),
    /** "Change account type": only while nothing has been submitted. */
    canChangeType: Boolean(picked) && !verification.hasStarted,
    isUpgrading,
    backToChooser: () => setPicked(null),
    upgradeToCorporate: () => setPicked('corporate'),
    headline,
    subhead,
  }
}
