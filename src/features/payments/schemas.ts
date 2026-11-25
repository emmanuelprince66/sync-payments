import { z } from 'zod'

export const transferSchema = z.object({
  fromBankId: z.string().min(1, 'Select an account to pay from'),
  bankCode: z.string().min(1, 'Select a bank'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit account number'),
  amount: z.string().refine(value => Number(value) > 0, 'Enter the amount to send'),
  categoryId: z.string(),
  narration: z.string(),
  pin: z.string(),
  /** Expense-account payouts only: what the money is (EXPENSE / PURCHASE / TRANSFER). */
  entryType: z.enum(['EXPENSE', 'PURCHASE', 'TRANSFER']),
  /** Expense-account payouts only: one bank transfer split across categories; `amount` follows their sum. */
  split: z.boolean(),
  items: z.array(z.object({ categoryId: z.string(), name: z.string(), amount: z.string() })),
}).superRefine((values, context) => {
  if (!values.split) return
  values.items.forEach((line, index) => {
    if (!line.categoryId) context.addIssue({ code: 'custom', message: 'Select a category', path: ['items', index, 'categoryId'] })
    if (!(Number(line.amount) > 0)) context.addIssue({ code: 'custom', message: 'Enter the amount', path: ['items', index, 'amount'] })
  })
})

export type TransferValues = z.infer<typeof transferSchema>

/** Step 1 only checks these; the PIN comes on the review step. */
export const TRANSFER_DETAIL_FIELDS = ['fromBankId', 'bankCode', 'accountNumber', 'amount', 'items'] as const
