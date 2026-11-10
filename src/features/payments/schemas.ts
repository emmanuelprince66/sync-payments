import { z } from 'zod'

export const transferSchema = z.object({
  fromBankId: z.string().min(1, 'Select an account to pay from'),
  bankCode: z.string().min(1, 'Select a bank'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit account number'),
  amount: z.string().refine(value => Number(value) > 0, 'Enter the amount to send'),
  categoryId: z.string(),
  narration: z.string(),
  pin: z.string(),
})

export type TransferValues = z.infer<typeof transferSchema>

/** Step 1 only checks these; the PIN comes on the review step. */
export const TRANSFER_DETAIL_FIELDS = ['fromBankId', 'bankCode', 'accountNumber', 'amount'] as const
