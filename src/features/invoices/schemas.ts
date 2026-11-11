import { z } from 'zod'
import { INVOICE_DESIGNS, INVOICE_PAYMENT_METHODS } from '@/api/invoices'
import { TAX_MODES, TAX_RATES } from './constants'

const required = (label: string) => z.string().trim().min(1, `${label} is required`)
const values = <T extends readonly { value: string }[]>(list: T) => list.map(item => item.value) as [T[number]['value'], ...T[number]['value'][]]
const isBlankText = (value: string) => value.trim() === ''

/** Number cells are typed text, so a half-typed row never turns into NaN; blanks count as empty. */
const lineSchema = z.object({
  itemId: z.string(),
  description: z.string(),
  qty: z.string().refine(value => isBlankText(value) || Number(value) > 0, 'Must be above 0'),
  price: z.string().refine(value => isBlankText(value) || (Number.isFinite(Number(value)) && Number(value) >= 0), 'Enter a valid price'),
  discount: z.string().refine(value => isBlankText(value) || (Number(value) >= 0 && Number(value) <= 100), '0 to 100'),
  account: z.string(),
  taxRate: z.enum(values(TAX_RATES)),
})

export type InvoiceLine = z.infer<typeof lineSchema>

/** Rows the user never touched are ignored, as in Xero. */
export const isBlankLine = (line: Pick<InvoiceLine, 'itemId' | 'description' | 'price'>) => !line.itemId && isBlankText(line.description) && isBlankText(line.price)

export const invoiceSchema = z.object({
  contactId: z.string().min(1, 'Choose a contact'),
  issueDate: required('Issue date'),
  dueDate: required('Due date'),
  number: required('Invoice number'),
  reference: z.string(),
  currency: z.literal('NGN'),
  taxMode: z.enum(values(TAX_MODES)),
  lines: z.array(lineSchema),
  // Design and branding for the printable invoice and its PDF.
  design: z.enum(INVOICE_DESIGNS),
  accent: z.string(),
  legalName: z.string(),
  address: z.string(),
}).superRefine((form, ctx) => {
  if (form.issueDate && form.dueDate && form.dueDate < form.issueDate) ctx.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date cannot be before the issue date' })
  const filled = form.lines.map((line, index) => ({ line, index })).filter(({ line }) => !isBlankLine(line))
  if (!filled.length) ctx.addIssue({ code: 'custom', path: ['lines', 'root'], message: 'Add at least one line item' })
  for (const { line, index } of filled) {
    if (isBlankText(line.description) && !line.itemId) ctx.addIssue({ code: 'custom', path: ['lines', index, 'description'], message: 'Add a description' })
    if (isBlankText(line.price)) ctx.addIssue({ code: 'custom', path: ['lines', index, 'price'], message: 'Enter a price' })
  }
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>

/** Record payment. The upper limit (the balance due) is checked when submitting, since it changes with every payment. */
export const paymentSchema = z.object({
  amount: z.string().trim().min(1, 'Enter the amount paid').refine(value => Number.isFinite(Number(value.replace(/,/g, ''))) && Number(value.replace(/,/g, '')) > 0, 'Enter an amount above 0'),
  date: required('Payment date'),
  method: z.enum(INVOICE_PAYMENT_METHODS),
  note: z.string().max(200, 'Keep the note under 200 characters'),
})
export type PaymentFormValues = z.infer<typeof paymentSchema>
export const parseAmount = (value: string) => Number(value.replace(/,/g, '')) || 0
