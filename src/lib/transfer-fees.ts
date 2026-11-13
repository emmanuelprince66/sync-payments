/**
 * What a transfer costs on top of the amount. Previews only: once the API has answered, show its numbers.
 *
 * Wallet transfers (POST wallet/transfer/<bank_id>/): sink-inventory's table exactly (Transactions.tsx
 * `transferCharge`, shown by TransferSummary as "System Charges" + Total), no stamp duty:
 *  - ₦10 up to and including ₦5,000, ₦25 up to and including ₦50,000, ₦50 above.
 *
 * Expense transfers (POST expenses/transfers/initiate/<id>/): the backend answers with `charges`,
 * `stamp_duty` and `total_debit`, and those are shown afterwards. Before initiating, sink's
 * ConfirmExpenseTransfer previews the charge with `estimateCharges` (types/expense-governance.ts), labelled
 * as an estimate; the ₦50 stamp duty from ₦10,000 is added here because the expense route returns it:
 *  - charges: ₦25 up to and including ₦50,000, ₦50 below ₦500,000, ₦100 from ₦500,000
 *  - stamp duty: ₦50 from ₦10,000 (inclusive)
 */
export type TransferFees = { charges: number; stampDuty: number; totalDebit: number }

const none: TransferFees = { charges: 0, stampDuty: 0, totalDebit: 0 }

const positive = (value: number | string) => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

/** sink's wallet transfer charge (useTransactionsHook `transferCharge`). */
export const walletTransferCharge = (value: number | string) => {
  const amount = positive(value)
  if (!amount) return 0
  if (amount <= 5000) return 10
  if (amount <= 50_000) return 25
  return 50
}

export const walletTransferFees = (value: number | string): TransferFees => {
  const amount = positive(value)
  if (!amount) return none
  const charges = walletTransferCharge(amount)
  return { charges, stampDuty: 0, totalDebit: amount + charges }
}

export const EXPENSE_STAMP_DUTY_THRESHOLD = 10_000
export const EXPENSE_STAMP_DUTY = 50

/** sink's estimateCharges for expense payouts. */
export const expenseTransferCharge = (value: number | string) => {
  const amount = positive(value)
  if (!amount) return 0
  if (amount <= 50_000) return 25
  if (amount < 500_000) return 50
  return 100
}

export const expenseTransferFees = (value: number | string): TransferFees => {
  const amount = positive(value)
  if (!amount) return none
  const charges = expenseTransferCharge(amount)
  const stampDuty = amount >= EXPENSE_STAMP_DUTY_THRESHOLD ? EXPENSE_STAMP_DUTY : 0
  return { charges, stampDuty, totalDebit: amount + charges + stampDuty }
}
