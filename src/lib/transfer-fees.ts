/**
 * What a transfer costs on top of the amount. Previews only: once the API has answered, show its numbers.
 *
 * The backend uses ONE table for plain wallet transfers (POST wallet/transfer/<bank_id>/) and expense
 * transfers (POST expenses/transfers/initiate/<id>/), confirmed by the backend team:
 *  - charges: ₦25 up to and including ₦50,000, ₦50 below ₦500,000, ₦100 from ₦500,000
 *  - stamp duty: ₦50 from ₦10,000 (inclusive)
 * There is no cheaper no-stamp-duty tier. Expense transfers answer with `charges`, `stamp_duty` and
 * `total_debit`, and those are shown once the API has replied.
 */
export type TransferFees = { charges: number; stampDuty: number; totalDebit: number }

const none: TransferFees = { charges: 0, stampDuty: 0, totalDebit: 0 }

const positive = (value: number | string) => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
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

/** Plain wallet transfers: the same table as expense transfers. */
export const walletTransferCharge = expenseTransferCharge
export const walletTransferFees = expenseTransferFees
