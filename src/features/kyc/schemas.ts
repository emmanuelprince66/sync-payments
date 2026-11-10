import { z } from 'zod'

/** NIN and BVN are both 11 digits in Nigeria. */
export const ELEVEN_DIGITS = /^\d{11}$/

/**
 * One schema covers all three individual tiers. Tier-specific requirements are
 * enforced at submit time (validateTier in useKyc), so a partially-filled form
 * can be carried between tiers without tripping validation on fields the user
 * has not reached yet. Same as sink-inventory's useKycHook.
 */
export const individualAccountSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  dob: z.string().optional(),
  nin: z.string().optional(),
  bvn: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

export const corporateAccountSchema = z.object({
  bvn: z.string().min(1, 'BVN is required'),
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  dob: z.string().optional(),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  registration_number: z.string().optional(),
  reg_date: z.string().optional(),
  address: z.string().min(1, 'Business address is required'),
  state: z.string().min(1, 'State is required'),
  tin: z.string().optional(),
})

export type IndividualFormValues = z.infer<typeof individualAccountSchema>
export type CorporateFormValues = z.infer<typeof corporateAccountSchema>

export const INDIVIDUAL_DEFAULTS: IndividualFormValues = { first_name: '', last_name: '', dob: '', nin: '', bvn: '', address: '', city: '', state: '' }
export const CORPORATE_DEFAULTS: CorporateFormValues = { bvn: '', firstname: '', lastname: '', dob: '', business_name: '', business_type: '', registration_number: '', reg_date: '', address: '', state: '', tin: '' }
