import { useState } from 'react'
import { CORPORATE_TIERS, INDIVIDUAL_TIERS } from '../tiers'
import type { Kyc } from './useKyc'

type IndividualTier = 1 | 2 | 3
type CorporateTier = 1 | 2

const firstUnfinished = (completed: number[]): IndividualTier => {
  if (!completed.includes(1)) return 1
  if (!completed.includes(2)) return 2
  return 3
}

const merge = (...lists: number[][]) => Array.from(new Set(lists.flat()))

/**
 * Individual tier rail (sink's IndividualTierFlow). The account payload is the
 * truth; tiers submitted in this session are merged in so the rail never goes
 * backwards while the refetch catches up. It opens on the first unfinished tier
 * and, once the merchant steers, stays where they put it.
 */
export function useIndividualFlow(kyc: Kyc) {
  const { verification } = kyc
  const [justSubmitted, setJustSubmitted] = useState<number[]>([])
  const [chosenTier, setChosenTier] = useState<IndividualTier | null>(null)
  const completedTiers = merge(verification.completedTiers, justSubmitted)
  const currentTier = chosenTier ?? firstUnfinished(verification.completedTiers)

  const canAccessTier = (tier: number) => tier === 1 || completedTiers.includes(tier - 1)
  const highest = completedTiers.length ? Math.max(...completedTiers) : 0
  const resumed = justSubmitted.length === 0

  return {
    currentTier,
    completedTiers,
    tierMeta: INDIVIDUAL_TIERS[currentTier - 1],
    canAccessTier,
    selectTier: (tier: number) => setChosenTier(tier as IndividualTier),
    /** Submits a tier and, once the API accepts it, moves the rail on. */
    submit: async (tier: IndividualTier, addressMode: 'autocomplete' | 'manual' = 'autocomplete') => {
      if (!(await kyc.submitTier(tier, addressMode))) return
      setJustSubmitted(prev => (prev.includes(tier) ? prev : [...prev, tier]))
      if (tier < 3) setChosenTier((tier + 1) as IndividualTier)
    },
    /** Success notice above the panel. */
    notice: completedTiers.length === 0 ? null : completedTiers.length === 3
      ? { title: 'All tiers verified', body: 'You have unlocked the maximum daily transaction limit.', next: null }
      : {
        title: resumed ? `Welcome back — Tier ${highest} is verified` : `Tier ${highest} verified`,
        body: resumed ? `You stopped after Tier ${highest}. Tier ${highest + 1} is ready whenever you are.` : 'You can keep using the account as it is, or continue for a higher limit.',
        next: currentTier < 3 && canAccessTier(currentTier + 1) ? currentTier + 1 : null,
      },
  }
}

/**
 * Corporate tier rail (sink's CorporateAcct). An approved submission counts as
 * Tier 2 done; one still under review does not, and "awaiting review" wins over
 * the local "just submitted" mark.
 */
export function useCorporateFlow(kyc: Kyc) {
  const { verification, corporateReview } = kyc
  const [justSubmitted, setJustSubmitted] = useState<number[]>([])
  const [chosenTier, setChosenTier] = useState<CorporateTier | null>(null)
  // Tier 2 counts only once approved: a filing under review must not read as verified.
  const completedTiers = merge(verification.corporateCompletedTiers, corporateReview.isApproved ? [2] : [], justSubmitted.filter(tier => tier !== 2))
  const currentTier: CorporateTier = chosenTier ?? (verification.corporateCompletedTiers.includes(1) ? 2 : 1)
  const awaitingReview = corporateReview.isPending
  const resuming = justSubmitted.length === 0 && completedTiers.length > 0
  const canAccessTier = (tier: number) => tier === 1 || completedTiers.includes(tier - 1)

  const submittedOn = corporateReview.submittedAt
    ? new Date(corporateReview.submittedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'recently'
  const directorCount = corporateReview.directors.length

  return {
    currentTier,
    completedTiers,
    tierMeta: CORPORATE_TIERS[currentTier - 1],
    canAccessTier,
    awaitingReview,
    selectTier: (tier: number) => setChosenTier(tier as CorporateTier),
    submit: async (tier: CorporateTier) => {
      if (!(await kyc.submitCorporateTier(tier))) return
      setJustSubmitted(prev => (prev.includes(tier) ? prev : [...prev, tier]))
      if (tier < 2) setChosenTier((tier + 1) as CorporateTier)
    },
    notice: completedTiers.length === 0 ? null : {
      tone: awaitingReview ? 'info' as const : 'success' as const,
      title: awaitingReview
        ? 'Documents submitted — under review'
        : completedTiers.includes(2)
          ? 'Corporate account fully verified'
          : resuming ? 'Welcome back — Tier 1 is verified' : 'Tier 1 submitted',
      body: awaitingReview
        ? 'We will email you as soon as they clear. Your Tier 1 limit stays in place until then.'
        : completedTiers.includes(2)
          ? 'Your corporate documents have been approved.'
          : resuming
            ? 'Tier 2 adds your CAC documents and director records. Pick up where you left off.'
            : 'You can start using the account now, or continue to full document verification.',
      next: !awaitingReview && !completedTiers.includes(2) && currentTier === 1 ? 2 : null,
    },
    /** "Filed 4 November 2026 · 2 directors" for the under-review state. */
    reviewSummary: `Filed ${submittedOn}${directorCount > 0 ? ` · ${directorCount} ${directorCount === 1 ? 'director' : 'directors'}` : ''}`,
    isRejected: corporateReview.isRejected,
  }
}
