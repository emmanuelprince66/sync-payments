/**
 * What a transfer costs on top of the amount. Previews only: once the API has answered, show its numbers.
 *
 * Expense payouts (POST expenses/transfers/initiate/<id>/), backend's updated table (Nov 2026):
 *  - charges: ₦50 below ₦50,000, ₦100 below ₦500,000, ₦500 from ₦500,000
 *  - stamp duty: ₦50 from ₦10,000 (inclusive)
 * They answer with `charges`, `stamp_duty` and `total_debit`, and those are shown once the API has replied.
 * Manual expense logging has no charges.
 *
 * Plain wallet transfers (POST wallet/transfer/<bank_id>/) keep the earlier table until the backend says
 * otherwise: ₦25 up to and including ₦50,000, ₦50 below ₦500,000, ₦100 from ₦500,000, same stamp duty.
 */
export type TransferFees = { charges: number; stampDuty: number; totalDebit: number }

const none: TransferFees = { charges: 0, stampDuty: 0, totalDebit: 0 }

const positive = (value: number | string) => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}


export const EXPENSE_STAMP_DUTY_THRESHOLD = 10_000
export const EXPENSE_STAMP_DUTY = 50

/** Expense payouts: ₦50 / ₦100 / ₦500. */
export const expenseTransferCharge = (value: number | string) => {
  const amount = positive(value)
  if (!amount) return 0
  if (amount < 50_000) return 50
  if (amount < 500_000) return 100
  return 500
}

/** Plain wallet transfers: ₦25 / ₦50 / ₦100. */
export const walletTransferCharge = (value: number | string) => {
  const amount = positive(value)
  if (!amount) return 0
  if (amount <= 50_000) return 25
  if (amount < 500_000) return 50
  return 100
}

const feesWith = (charge: (amount: number) => number) => (value: number | string): TransferFees => {
  const amount = positive(value)
  if (!amount) return none
  const charges = charge(amount)
  const stampDuty = amount >= EXPENSE_STAMP_DUTY_THRESHOLD ? EXPENSE_STAMP_DUTY : 0
  return { charges, stampDuty, totalDebit: amount + charges + stampDuty }
}

export const expenseTransferFees = feesWith(expenseTransferCharge)
export const walletTransferFees = feesWith(walletTransferCharge)
