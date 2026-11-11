import { z } from 'zod'

const money = (message: string) => z.string().trim().refine(value => Number(value) > 0, message)

export const expenseSchema = z.object({
  name: z.string().trim().min(1, 'Enter the merchant or payee'),
  amount: money('Enter the amount'),
  categoryId: z.string().min(1, 'Select a category'),
  date: z.string().min(1, 'Choose the expense date'),
  note: z.string(),
})
export type ExpenseValues = z.infer<typeof expenseSchema>

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  total: money('Enter the budget amount'),
  months: z.string().refine(value => Number(value) >= 1 && Number(value) <= 12, 'Between 1 and 12 months'),
  year: z.string().min(4, 'Select a year'),
})
export type BudgetValues = z.infer<typeof budgetSchema>

export const categorySchema = z.object({ name: z.string().trim().min(1, 'Enter a category name') })
export type CategoryValues = z.infer<typeof categorySchema>

/** "0" means a limit isn't enforced. A day's allowance can't be smaller than one transaction's (backend rule). */
export const settingsSchema = z.object({
  maxPerTransaction: z.string(),
  dailyTransferLimit: z.string(),
  dailyTransactionLimit: z.string(),
  requireApprovalForAll: z.boolean(),
}).refine(values => {
  const daily = Number(values.dailyTransferLimit)
  const single = Number(values.maxPerTransaction)
  return !(daily > 0 && single > 0 && daily < single)
}, { message: 'The daily limit cannot be lower than the single-transaction limit.', path: ['dailyTransferLimit'] })
export type SettingsValues = z.infer<typeof settingsSchema>

/** One staff member's expense rights (sink: StaffExpensePermissions). Blank caps mean "no personal cap". */
export const rightsSchema = z.object({
  canLog: z.boolean(),
  canInitiate: z.boolean(),
  canApprove: z.boolean(),
  maxTransfer: z.string(),
  dailyTransfer: z.string(),
  dailyCount: z.string(),
  maxApproval: z.string(),
}).refine(values => {
  const daily = Number(values.dailyTransfer)
  const single = Number(values.maxTransfer)
  return !(daily > 0 && single > 0 && daily < single)
}, { message: 'The daily limit cannot be lower than the single-transaction limit.', path: ['dailyTransfer'] })
export type RightsValues = z.infer<typeof rightsSchema>
