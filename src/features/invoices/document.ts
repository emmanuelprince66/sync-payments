import { invoiceBalance, type Invoice, type InvoiceDesign } from '@/api/invoices'

/** Everything a printable invoice shows, from the Create form or a saved invoice. */
export type InvoiceDocumentModel = {
  design: InvoiceDesign
  accent: string
  legalName: string
  address: string
  logoUrl: string
  party: string
  partyEmail: string
  partyPhone: string
  number: string
  reference: string
  issueDate: string
  dueDate: string
  lines: { description: string; qty: number; price: number; amount: number }[]
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  balance: number
}

export const documentFromInvoice = (invoice: Invoice): InvoiceDocumentModel => ({
  design: invoice.design,
  accent: invoice.branding.accent,
  legalName: invoice.branding.legalName,
  address: invoice.branding.address,
  logoUrl: invoice.branding.logoUrl,
  party: invoice.client,
  partyEmail: invoice.clientEmail,
  partyPhone: invoice.clientPhone,
  number: invoice.id,
  reference: invoice.reference,
  issueDate: invoice.issued,
  dueDate: invoice.due,
  lines: invoice.lines.map(line => ({ description: line.description, qty: line.qty, price: line.price, amount: line.amount })),
  subtotal: invoice.subtotal,
  tax: invoice.tax,
  total: invoice.amount,
  amountPaid: invoice.amountPaid,
  balance: invoiceBalance(invoice),
})

/** "#529661" → "rgba(82,150,97,0.08)". Plain rgba keeps the PDF renderer happy. */
export const tint = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(char => char + char).join('') : clean.padEnd(6, '0').slice(0, 6)
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value)) return `rgba(82,150,97,${alpha})`
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`
}

/** "INV-0042" → "0042". */
export const documentNumber = (number: string) => number.replace(/^\D+/, '') || number

/** A4 at 96 dpi: the document is laid out at this exact size, on screen and in the PDF. */
export const A4_WIDTH_PX = 794
export const A4_HEIGHT_PX = 1123
