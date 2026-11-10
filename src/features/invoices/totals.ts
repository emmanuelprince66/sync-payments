import type { TaxMode } from './constants'
import type { InvoiceLine } from './schemas'

type TotalsLine = Pick<InvoiceLine, 'qty' | 'price' | 'discount' | 'taxRate'>

const num = (value: string | number | undefined) => Number(value) || 0
const round = (value: number) => Math.round(value * 100) / 100

/**
 * One line's figures. `amount` is what the Amount column shows (qty × price less discount);
 * with inclusive tax that already contains the tax, so `net` backs it out.
 */
export const lineAmounts = (line: TotalsLine, mode: TaxMode) => {
  const discount = Math.min(Math.max(num(line.discount), 0), 100)
  const amount = round(num(line.qty) * num(line.price) * (1 - discount / 100))
  const rate = mode === 'none' ? 0 : num(line.taxRate) / 100
  const tax = round(mode === 'inclusive' ? amount - amount / (1 + rate) : amount * rate)
  return { amount, tax, net: mode === 'inclusive' ? round(amount - tax) : amount }
}

/** Subtotal (before tax), total tax and total for the whole invoice. */
export const invoiceTotals = (lines: TotalsLine[], mode: TaxMode) => {
  const rows = lines.map(line => lineAmounts(line, mode))
  const subtotal = round(rows.reduce((sum, row) => sum + row.net, 0))
  const tax = round(rows.reduce((sum, row) => sum + row.tax, 0))
  return { subtotal, tax, total: round(subtotal + tax) }
}
