import type { AccountType } from '@/api/kyc'

/**
 * Minimum wallet tier a sole trader needs before BNPL can be switched on.
 *
 * TEMPORARY (same as sink-inventory) — lowered from 3 to 1 so Akawopay can be
 * tested with Tier 1 test wallets, matching the same relaxation on the backend.
 * Tier 3 (BVN, NIN and address) is the real lending bar: PUT THIS BACK TO 3
 * BEFORE PRODUCTION, or unverified merchants can offer credit in your name.
 *
 * Typed as number so the messages below can still compare against 3.
 */
export const MIN_BNPL_TIER: number = 1

/** Corporate approval only gates BNPL once the real Tier 3 bar is restored. */
export const ENFORCE_CORPORATE_APPROVAL = MIN_BNPL_TIER >= 3

/** Fee charged by Akawopay on each successful disbursement. */
export const BNPL_FEE_LABEL = 'Fee: 3% per successful disbursement.'

/**
 * Why a merchant may or may not offer BNPL. Akawopay lends against the
 * merchant's verified identity, so the bar is a sufficiently upgraded wallet
 * for a sole trader, or approved documents for a company. Worked out here so
 * the card can say what is missing before the merchant flips a switch; the
 * API's answer still decides, and its message is shown verbatim when they disagree.
 */
export function bnplEligibility({ walletLive, tier, accountType, corporateApproved }: {
  walletLive: boolean
  tier: number
  accountType: AccountType | null
  corporateApproved: boolean
}): { ready: boolean; reason: string | null } {
  if (!walletLive) return { ready: false, reason: 'You must create and activate your Sync360 wallet before offering BNPL.' }

  if (accountType === 'corporate' && ENFORCE_CORPORATE_APPROVAL) {
    return corporateApproved
      ? { ready: true, reason: null }
      : { ready: false, reason: 'Your corporate verification documents must be approved before offering BNPL.' }
  }

  // Individual, and anything not yet typed — the stricter rule is the safer default.
  return tier >= MIN_BNPL_TIER
    ? { ready: true, reason: null }
    : {
        ready: false,
        reason: MIN_BNPL_TIER >= 3
          ? 'Your wallet must be upgraded to Tier 3 (BVN, NIN, and Address verified) to offer BNPL.'
          : `Your wallet must be upgraded to Tier ${MIN_BNPL_TIER} to offer BNPL.`,
      }
}
