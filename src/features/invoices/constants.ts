import type { InvoiceDesign } from '@/api/invoices'

/** The three printable designs, with the brand colour each starts with. */
export const INVOICE_TEMPLATES: readonly { name: InvoiceDesign; note: string; accent: string }[] = [
  { name: 'Classic', note: 'Clean letterhead with a tinted bill-to panel', accent: '#529661' },
  { name: 'Ledger', note: 'Bold header band and ruled accounting table', accent: '#1D261C' },
  { name: 'Studio', note: 'Big number, side stripe, editorial layout', accent: '#B97445' },
]

export type InvoiceTemplate = InvoiceDesign

export const designAccent = (design: InvoiceDesign) => INVOICE_TEMPLATES.find(item => item.name === design)?.accent ?? INVOICE_TEMPLATES[0].accent

/** How line prices treat tax, as Xero's "Amounts are" setting. */
export const TAX_MODES = [
  { value: 'exclusive', label: 'Tax exclusive' },
  { value: 'inclusive', label: 'Tax inclusive' },
  { value: 'none', label: 'No tax' },
] as const
export type TaxMode = (typeof TAX_MODES)[number]['value']

/** Nigerian VAT is 7.5%; exempt and zero-rated supplies carry none. */
export const TAX_RATES = [
  { value: '7.5', label: 'VAT 7.5%' },
  { value: '0', label: 'Exempt 0%' },
] as const
export type TaxRate = (typeof TAX_RATES)[number]['value']

/** Revenue accounts a sales line can be coded to. */
export const SALES_ACCOUNTS = [
  { value: '200', label: '200 · Sales' },
  { value: '260', label: '260 · Other revenue' },
  { value: '270', label: '270 · Interest income' },
] as const

export const DEFAULT_ACCOUNT = '200'
export const DEFAULT_TAX_RATE: TaxRate = '7.5'
export const PAYMENT_TERMS_DAYS = 14

/** Line-item columns that can be hidden from the Columns menu. Description, Qty, Price and Amount always show. */
export const OPTIONAL_COLUMNS = [
  { id: 'item', label: 'Item' },
  { id: 'discount', label: 'Disc. (%)' },
  { id: 'account', label: 'Account' },
  { id: 'taxRate', label: 'Tax rate' },
  { id: 'taxAmount', label: 'Tax amount' },
] as const
export type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number]['id']

/** The list endpoint's status filter (query param `status`). */
export const INVOICE_STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SENT', label: 'Sent' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
  { value: 'VOID', label: 'Void' },
] as const
