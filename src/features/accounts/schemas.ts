import { z } from 'zod'

const pin = (label: string) => z.string().regex(/^\d{4}$/, `${label} must be 4 digits`)

export const setPinSchema = z.object({ pin: pin('PIN'), confirmPin: pin('Confirm PIN') }).refine(values => values.pin === values.confirmPin, { message: "PINs don't match", path: ['confirmPin'] })
export type SetPinValues = z.infer<typeof setPinSchema>

export const changePinSchema = z.object({ oldPin: pin('Current PIN'), newPin: pin('New PIN') })
export type ChangePinValues = z.infer<typeof changePinSchema>

export const verifyResetSchema = z.object({ token: z.string().trim().min(1, 'Enter the code we emailed you') })
export type VerifyResetValues = z.infer<typeof verifyResetSchema>

export const resetPinSchema = z.object({ newPin: pin('New PIN') })
export type ResetPinValues = z.infer<typeof resetPinSchema>

export const subAccountSchema = z.object({
  previousAccount: z.string().trim().min(1, 'Select the account to fund it from'),
  branch: z.string().trim().min(1, 'Enter a name for this account'),
  isExpenses: z.boolean(),
})
export type SubAccountValues = z.infer<typeof subAccountSchema>

export const payoutBankSchema = z.object({
  bankCode: z.string().min(1, 'Select a bank'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit account number'),
})
export type PayoutBankValues = z.infer<typeof payoutBankSchema>
