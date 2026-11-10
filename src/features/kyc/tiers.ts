/**
 * KYC tiers, the transaction limits they unlock, and the document checklists
 * each tier asks for.
 *
 * One source of truth on purpose: these figures were previously written out by
 * hand in three places and had drifted badly — the individual tiers were being
 * advertised at ₦5M / ₦10M / ₦50M when the real limits are ₦50K / ₦200K / ₦5M,
 * overstating Tier 1 by a hundredfold. A merchant reading that would plan
 * around money the account cannot move.
 */

export interface KycTier {
  tier: number;
  title: string;
  /** What has to be supplied to reach this tier. */
  requirement: string;
  /** Daily / single transaction limit, formatted for display. */
  limit: string;
  description: string;
}

export const INDIVIDUAL_TIERS: KycTier[] = [
  {
    tier: 1,
    title: "Basic Verification",
    requirement: "NIN or BVN",
    limit: "₦50,000",
    description: "Either identity number is enough to start.",
  },
  {
    tier: 2,
    title: "Enhanced Verification",
    requirement: "NIN and BVN",
    limit: "₦200,000",
    description: "Both identity numbers on file.",
  },
  {
    tier: 3,
    title: "Full Verification",
    requirement: "NIN, BVN and proof of address",
    limit: "₦5,000,000",
    description: "Adds a verified residential address.",
  },
];

export const CORPORATE_TIERS: KycTier[] = [
  {
    tier: 1,
    title: "Business Information",
    requirement: "Director & business details",
    limit: "₦100,000",
    description: "Who runs the business and where it is registered.",
  },
  {
    tier: 2,
    title: "Full Legal & Director Verification",
    requirement: "CAC documents, TIN & director records",
    limit: "₦5,000,000",
    description: "Company filings plus a record for every director.",
  },
];

/** "₦50,000 daily" — the limits are per day as well as per transaction. */
export const dailyLimit = (tier: KycTier) => `${tier.limit} daily`;

export interface DocumentSpec {
  key: string;
  label: string;
  hint: string;
  /** File types the picker offers. Spelled out on every entry so the derived
   *  union always carries the property. */
  accept: string;
}

/** Scans and photos of paperwork. */
const PAPER = ".pdf,.jpg,.jpeg,.png";

/**
 * Company filings, keyed by the exact field name POST
 * /wallet/upgrade_corporate_account/{id}/ expects — so the multipart body is
 * built straight off these keys with nothing to map or mistype in between.
 */
export const CORPORATE_DOCUMENTS = [
  {
    key: "cac_certificate",
    label: "CAC Certificate of Incorporation",
    hint: "The certificate issued by the Corporate Affairs Commission.",
    accept: PAPER,
  },
  {
    key: "cac_memorandum",
    label: "MEMART",
    hint: "Memorandum and Articles of Association.",
    accept: PAPER,
  },
  {
    key: "rc_document",
    label: "RC / BN Document",
    hint: "The company registration document.",
    accept: PAPER,
  },
  {
    key: "status_report",
    label: "CAC Status Report",
    hint: "The current status report or extract from CAC.",
    accept: PAPER,
  },
  {
    key: "board_resolution",
    label: "Board Resolution",
    hint: "The resolution authorising this account to be opened.",
    accept: PAPER,
  },
  {
    key: "proof_of_address",
    label: "Proof of Business Address",
    hint: "Tenancy agreement or similar showing the office address.",
    accept: PAPER,
  },
  {
    key: "utility_bill",
    label: "Utility Bill",
    hint: "For the business address, not older than 3 months.",
    accept: PAPER,
  },
] as const satisfies readonly DocumentSpec[];

/**
 * What each director supplies. Two documents, not four: the endpoint's
 * director entries carry fullname, identification and passport only, so a
 * proof of address or signature collected here would be dropped on the floor.
 */
export const DIRECTOR_DOCUMENTS = [
  {
    key: "identification",
    label: "Government-issued ID",
    hint: "NIN slip, voter's card, driver's licence or passport data page.",
    accept: PAPER,
  },
  {
    key: "passport",
    label: "Passport Photograph",
    hint: "Recent passport-size photo on a plain background.",
    accept: "image/*",
  },
] as const satisfies readonly DocumentSpec[];

export type CorporateDocKey = (typeof CORPORATE_DOCUMENTS)[number]["key"];
export type DirectorDocKey = (typeof DIRECTOR_DOCUMENTS)[number]["key"];

export { NIGERIAN_STATES } from '@/lib/nigeria';

/**
 * Registration classes CAC issues.
 *
 * The values are the codes create_bank_account expects — "RC" or "BN", and
 * nothing else. They read as abbreviations of the labels, which is exactly why
 * they are easy to "tidy" into BUSINESS / LIMITED_LIABILITY; those were what
 * this sent before, and the account could not be opened with them.
 */
export const BUSINESS_TYPES = [
  { value: "BN", label: "Business Name (BN)" },
  { value: "RC", label: "Limited Liability (RC)" },
] as const;
