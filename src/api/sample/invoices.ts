import { mockDelay } from '@/lib/api-client'
import {
  invoicePaymentState, OPEN_PAYMENT_STATES, roundMoney as round,
  type Invoice, type InvoiceActivity, type InvoiceActivityType, type InvoiceBranding, type InvoiceClientSnapshot, type InvoiceDesign,
  type InvoiceInput, type InvoiceLineRecord, type InvoiceListParams, type InvoiceListResult, type InvoicePayment, type InvoicePaymentMethod,
  type InvoiceReminderChannel, type InvoiceStatus,
} from '../invoice-model'

/**
 * Mock-mode invoice store (VITE_AUTH_MODE=mock). Live mode uses the invoices API in
 * `../invoices`; these functions mirror its rules (server totals, server-assigned numbers,
 * draft-only edits, soft-reversed payments, VOID left out of the list). Analytics, customer
 * summaries, reminders, saved items and next-number answer in the backend's wire shapes, so
 * the live mappers in `../invoices` read them exactly as they read the server.
 */

const dayOffset = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const stamp = (days: number, hour = 10) => `${dayOffset(days)}T${String(hour).padStart(2, '0')}:00:00`
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const publicUrlFor = (number: string) => `https://pay.sync360.africa/i/${number.toLowerCase()}`

const SEED_BRANDING: InvoiceBranding = { accent: '#529661', legalName: 'Kemi Store Ltd', address: '14 Admiralty Way, Lekki Phase 1, Lagos', logoUrl: '' }
const SEED_CREATOR = 'Kemi Adeyemi'

const lineFigures = (row: Omit<InvoiceLineRecord, 'amount' | 'tax'>, taxMode: Invoice['taxMode']): InvoiceLineRecord => {
  const amount = round(row.qty * row.price * (1 - Math.min(Math.max(row.discount, 0), 100) / 100))
  const rate = taxMode === 'none' ? 0 : row.taxRate / 100
  const tax = round(taxMode === 'inclusive' ? amount - amount / (1 + rate) : amount * rate)
  return { ...row, amount, tax }
}

const totalsOf = (lines: InvoiceLineRecord[], taxMode: Invoice['taxMode']) => {
  const tax = round(lines.reduce((sum, row) => sum + row.tax, 0))
  const gross = round(lines.reduce((sum, row) => sum + row.amount, 0))
  const subtotal = taxMode === 'inclusive' ? round(gross - tax) : gross
  return { subtotal, tax, amount: round(subtotal + tax) }
}

const line = (description: string, qty: number, price: number) => lineFigures({ description, qty, price, discount: 0, taxRate: 7.5, account: '200', itemId: '' }, 'exclusive')

/** Amount paid, balance and Paid/Sent status from the payments that still count. */
const settle = (invoice: Invoice): Invoice => {
  const amountPaid = round(invoice.payments.filter(payment => !payment.reversed).reduce((sum, payment) => sum + payment.amount, 0))
  const balance = Math.max(round(invoice.amount - amountPaid), 0)
  const status: InvoiceStatus = balance <= 0 && invoice.amount > 0 && invoice.status !== 'Draft' ? 'Paid' : invoice.status === 'Paid' ? (invoice.viewed ? 'Viewed' : 'Sent') : invoice.status
  return { ...invoice, amountPaid, balance, status }
}

type SeedInput = {
  id: string; clientId: string; client: string; email: string; phone: string; issuedDaysAgo: number; termDays: number
  status: InvoiceStatus; design: InvoiceDesign; accent: string; lines: InvoiceLineRecord[]; payments?: { amount: number; daysAgo: number; method: InvoicePaymentMethod }[]
}

const seed = (input: SeedInput): Invoice => {
  const payments: InvoicePayment[] = (input.payments ?? []).map((payment, index) => ({
    id: `${input.id}-p${index + 1}`, amount: payment.amount, date: dayOffset(-payment.daysAgo), method: payment.method, note: '', recordedBy: SEED_CREATOR, recordedAt: stamp(-payment.daysAgo, 14), reversed: false, reversedAt: '', reversedBy: '',
  }))
  const viewed = input.status === 'Viewed'
  const activity: InvoiceActivity[] = [
    { id: `${input.id}-a1`, type: 'created' as const, message: 'Invoice created', by: SEED_CREATOR, at: stamp(-input.issuedDaysAgo, 9) },
    ...(input.status === 'Draft' ? [] : [{ id: `${input.id}-a2`, type: 'sent' as const, message: `Sent to ${input.client}`, by: SEED_CREATOR, at: stamp(-input.issuedDaysAgo, 10) }]),
    ...(viewed ? [{ id: `${input.id}-av`, type: 'viewed' as const, message: `Viewed by ${input.client}`, by: input.client, at: stamp(-input.issuedDaysAgo + 1, 11) }] : []),
    ...payments.map((payment, index) => ({ id: `${input.id}-a${index + 3}`, type: 'payment' as const, message: `Payment of ₦${payment.amount.toLocaleString()} recorded`, by: SEED_CREATOR, at: payment.recordedAt })),
  ].reverse()
  return settle({
    id: input.id, number: input.id, reference: `REF-${input.id.split('-')[1]}`, client: input.client, clientId: input.clientId, clientEmail: input.email, clientPhone: input.phone,
    ...totalsOf(input.lines, 'exclusive'), amountPaid: 0, balance: 0,
    issued: dayOffset(-input.issuedDaysAgo), due: dayOffset(-input.issuedDaysAgo + input.termDays), status: input.status, viewed, viewedAt: viewed ? stamp(-input.issuedDaysAgo + 1, 11) : '',
    taxMode: 'exclusive', design: input.design, branding: { ...SEED_BRANDING, accent: input.accent }, note: '',
    lines: input.lines, payments, activity, publicUrl: input.status === 'Draft' ? '' : publicUrlFor(input.id), createdBy: SEED_CREATOR, createdAt: stamp(-input.issuedDaysAgo, 9),
  })
}

let invoices: Invoice[] = [
  seed({ id: 'INV-1048', clientId: 'mock-cus-a1b2c3', client: 'Chidinma Okeke', email: 'chidinma@example.com', phone: '08032457791', issuedDaysAgo: 3, termDays: 14, status: 'Sent', design: 'Classic', accent: '#529661',
    lines: [line('Onboarding & setup', 1, 150000), line('Consulting (hourly)', 4, 45000)] }),
  seed({ id: 'INV-1047', clientId: 'mock-cus-v4w5x6', client: 'Segun Oladipo', email: 'segun@example.com', phone: '08099001122', issuedDaysAgo: 9, termDays: 14, status: 'Viewed', design: 'Studio', accent: '#B97445',
    lines: [line('Monthly support', 3, 85000)], payments: [{ amount: 100000, daysAgo: 2, method: 'Bank transfer' }] }),
  seed({ id: 'INV-1046', clientId: 'mock-cus-j1k2l3', client: 'Ibrahim Musa', email: 'ibrahim.musa@example.com', phone: '09033218877', issuedDaysAgo: 20, termDays: 14, status: 'Paid', design: 'Ledger', accent: '#1D261C',
    lines: [line('Consulting (hourly)', 6, 45000)], payments: [{ amount: 290250, daysAgo: 12, method: 'Bank transfer' }] }),
  seed({ id: 'INV-1045', clientId: 'mock-cus-d4e5f6', client: 'Tobi Adeyemi', email: 'tobi@example.com', phone: '08124401290', issuedDaysAgo: 30, termDays: 14, status: 'Sent', design: 'Classic', accent: '#529661',
    lines: [line('Monthly support', 1, 85000), line('Terminal configuration', 2, 25000)] }),
]

/** Saved items, as GET …/saved-items/ returns them. */
type WireItem = { id: string; description: string; default_price: string; default_tax_rate: string; account_code: string; created_at: string }
let items: WireItem[] = [
  { id: 'i-1', description: 'Consulting (hourly)', default_price: '45000.00', default_tax_rate: '7.50', account_code: '200', created_at: stamp(-40) },
  { id: 'i-2', description: 'Onboarding & setup', default_price: '150000.00', default_tax_rate: '7.50', account_code: '200', created_at: stamp(-40) },
  { id: 'i-3', description: 'Monthly support', default_price: '85000.00', default_tax_rate: '7.50', account_code: '260', created_at: stamp(-40) },
]

const numberOf = (number: string) => Number(number.split('-')[1]) || 0
const notFound = (id: string) => new Error(`Invoice ${id} was not found.`)
const nextNumber = () => `INV-${Math.max(0, ...invoices.map(invoice => numberOf(invoice.number))) + 1}`
const isOverdue = (invoice: Invoice) => invoicePaymentState(invoice) === 'Overdue'

/** { next_number } */
export const mockNextInvoiceNumber = () => mockDelay({ next_number: nextNumber() }, 200)

/** VOID invoices are left out, as on the server. */
export const mockListInvoices = ({ page, limit, search, status, customer, startDate, endDate }: InvoiceListParams): Promise<InvoiceListResult> => {
  const term = search.trim().toLowerCase()
  const matches = invoices.filter(invoice => invoice.status !== 'Void'
    && (!term || invoice.number.toLowerCase().includes(term) || invoice.client.toLowerCase().includes(term))
    && (!status || (status === 'OVERDUE' ? isOverdue(invoice) : invoice.status.toUpperCase() === status))
    && (!customer || invoice.clientId === customer)
    && (!startDate || invoice.issued >= startDate) && (!endDate || invoice.issued <= endDate))
  return mockDelay({ invoices: matches.slice((page - 1) * limit, page * limit), total: matches.length, pages: Math.max(1, Math.ceil(matches.length / limit)) })
}

export const mockGetInvoice = (id: string) => {
  const found = invoices.find(invoice => invoice.id === id)
  return found ? mockDelay(found, 250) : Promise.reject(notFound(id))
}

const monthKey = (offset: number) => {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** The analytics endpoint's exact shape. Overdue is derived (open and past due); VOID is counted. */
export const mockInvoiceAnalytics = () => {
  const counts: Record<string, number> = { DRAFT: 0, APPROVED: 0, SENT: 0, VIEWED: 0, OVERDUE: 0, PAID: 0, VOID: 0 }
  for (const invoice of invoices) {
    const key = invoice.status !== 'Void' && isOverdue(invoice) ? 'OVERDUE' : invoice.status.toUpperCase()
    counts[key] = (counts[key] ?? 0) + 1
  }
  const open = invoices.filter(invoice => OPEN_PAYMENT_STATES.includes(invoicePaymentState(invoice)))
  return mockDelay({
    paid_this_month: round(invoices.reduce((total, invoice) => total + invoice.amountPaid, 0)).toFixed(2),
    change_from_last_month_pct: 16.2,
    average_days_to_pay: 8.4,
    collection_rate_pct: 71.0,
    expected_cash: round(open.reduce((total, invoice) => total + invoice.balance, 0)).toFixed(2),
    counts_by_status: counts,
    monthly_sent_vs_paid: [380000, 540000, 470000, 680000, 720000, 880000].map((sent, index) => ({
      month: monthKey(5 - index), sent: sent.toFixed(2), paid: [250000, 400000, 420000, 510000, 610000, 690000][index].toFixed(2),
    })),
  })
}

const summaryFor = (customerId: string) => {
  const mine = invoices.filter(invoice => invoice.clientId === customerId && invoice.status !== 'Draft' && invoice.status !== 'Void')
  return {
    total_paid: round(mine.reduce((sum, invoice) => sum + invoice.amountPaid, 0)).toFixed(2),
    total_unpaid: round(mine.reduce((sum, invoice) => sum + invoice.balance, 0)).toFixed(2),
    overdue_amount: round(mine.filter(isOverdue).reduce((sum, invoice) => sum + invoice.balance, 0)).toFixed(2),
    invoice_count: mine.length,
  }
}

/** GET invoices/customers/{id}/summary/ */
export const mockCustomerSummary = (customerId: string) => mockDelay(summaryFor(customerId), 250)

/** GET …/customer-summaries/?customer_ids=a,b → { results: [...] } */
export const mockCustomerSummaries = (customerIds: string[]) => mockDelay({ results: customerIds.map(customerId => ({ customer_id: customerId, ...summaryFor(customerId) })) }, 250)

const update = (id: string, change: (invoice: Invoice) => Invoice) => {
  const found = invoices.find(invoice => invoice.id === id)
  if (!found) return Promise.reject(notFound(id))
  try {
    const next = change(found)
    invoices = invoices.map(invoice => (invoice.id === id ? next : invoice))
    return mockDelay(next, 350)
  } catch (error) {
    return Promise.reject(error)
  }
}

const log = (type: InvoiceActivityType, message: string, by: string): InvoiceActivity => ({ id: newId('act'), type, message, by, at: new Date().toISOString() })

const fromInput = (input: InvoiceInput, client: InvoiceClientSnapshot, logoUrl: string) => {
  const lines = input.lines.map(row => lineFigures(row, input.taxMode))
  return {
    client: client.name, clientId: input.customerId, clientEmail: client.email, clientPhone: client.phone,
    issued: input.issueDate, due: input.dueDate, taxMode: input.taxMode, design: input.design, note: input.note,
    branding: { accent: input.accent, legalName: input.legalName, address: input.address, logoUrl }, lines, ...totalsOf(lines, input.taxMode),
  }
}

export type MockSaveInput = { input: InvoiceInput; client: InvoiceClientSnapshot; logoUrl: string; by: string }

const NEXT_STATUS: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = { Draft: ['Approved'], Approved: ['Sent'] }

const moveTo = (invoice: Invoice, status: 'Approved' | 'Sent', by: string): Invoice => {
  if (!NEXT_STATUS[invoice.status]?.includes(status)) throw new Error(`A ${invoice.status.toLowerCase()} invoice can't be marked ${status.toLowerCase()}.`)
  const entry = status === 'Approved' ? log('approved', 'Approved', by) : log('sent', `Sent to ${invoice.client}`, by)
  return { ...invoice, status, publicUrl: status === 'Sent' ? publicUrlFor(invoice.number) : invoice.publicUrl, activity: [entry, ...invoice.activity] }
}

/** Creates an invoice straight in its status (logo included), in one call as in live mode. The number is assigned here. */
export const mockCreateInvoice = ({ input, client, logoUrl, by, status }: MockSaveInput & { status: 'Draft' | 'Approved' | 'Sent' }) => {
  const number = nextNumber()
  let invoice = settle({
    id: number, number, reference: `REF-${Date.now().toString(36).toUpperCase()}`, ...fromInput(input, client, logoUrl),
    amountPaid: 0, balance: 0, status: 'Draft', viewed: false, viewedAt: '', payments: [], publicUrl: '', createdBy: by, createdAt: new Date().toISOString(),
    activity: [log('created', 'Invoice created', by)],
  })
  if (status !== 'Draft') invoice = moveTo(invoice, 'Approved', by)
  if (status === 'Sent') invoice = moveTo(invoice, 'Sent', by)
  invoices = [invoice, ...invoices]
  return mockDelay(invoice)
}

export const mockUpdateInvoice = (id: string, save: MockSaveInput) => update(id, invoice => {
  if (invoice.status !== 'Draft') throw new Error('Only draft invoices can be edited.')
  const client = save.client.name ? save.client : { name: invoice.client, email: invoice.clientEmail, phone: invoice.clientPhone }
  return settle({ ...invoice, ...fromInput(save.input, client, save.logoUrl || invoice.branding.logoUrl) })
})

export const mockSetInvoiceStatus = (id: string, status: 'Approved' | 'Sent', by: string) => update(id, invoice => moveTo(invoice, status, by))

export type MockPaymentInput = { invoiceId: string; amount: number; date: string; method: InvoicePaymentMethod; note: string; recordedBy: string }

/** Adds a full or part payment. Paying off the balance marks the invoice Paid. */
export const mockRecordPayment = ({ invoiceId, recordedBy, ...payment }: MockPaymentInput) => update(invoiceId, invoice => {
  if (invoice.status === 'Draft' || invoice.status === 'Void') throw new Error('Payments can only be recorded on approved or sent invoices.')
  if (payment.amount <= 0 || payment.amount > invoice.balance + 0.001) throw new Error('Payment must be above zero and no more than the balance due.')
  const entry: InvoicePayment = { id: newId('pay'), ...payment, recordedBy, recordedAt: new Date().toISOString(), reversed: false, reversedAt: '', reversedBy: '' }
  const next = settle({ ...invoice, payments: [entry, ...invoice.payments] })
  return { ...next, activity: [
    ...(next.status === 'Paid' ? [log('paid', 'Paid in full', recordedBy)] : []),
    log('payment', `Payment of ₦${payment.amount.toLocaleString()} recorded`, recordedBy),
    ...invoice.activity,
  ] }
})

/** Soft reversal: the payment stays in the history but stops counting; a Paid invoice goes back to Sent. */
export const mockReversePayment = ({ invoiceId, paymentId, by }: { invoiceId: string; paymentId: string; by: string }) => update(invoiceId, invoice => {
  const target = invoice.payments.find(payment => payment.id === paymentId)
  if (!target || target.reversed) throw new Error('This payment was already reversed.')
  const next = settle({ ...invoice, payments: invoice.payments.map(payment => (payment.id === paymentId ? { ...payment, reversed: true, reversedAt: new Date().toISOString(), reversedBy: by } : payment)) })
  return { ...next, activity: [log('payment_reversed', `Payment of ₦${target.amount.toLocaleString()} reversed`, by), ...invoice.activity] }
})

const REMINDER_LOG: Record<InvoiceReminderChannel, string> = {
  email: 'Reminder emailed',
  whatsapp: 'WhatsApp reminder opened on device',
  share: 'Reminder shared from device',
}

/** Logs the reminder and answers like the server: email is sent, WhatsApp is not attempted, share has no send result. */
export const mockSendReminder = async ({ invoiceId, channel, by }: { invoiceId: string; channel: InvoiceReminderChannel; by: string }) => {
  const invoice = await update(invoiceId, current => ({ ...current, activity: [log('reminder', REMINDER_LOG[channel], by), ...current.activity] }))
  return {
    channel,
    public_url: invoice.publicUrl,
    send_attempted: channel === 'email',
    send_succeeded: channel === 'share' ? null : channel === 'email',
    send_message: channel === 'whatsapp' ? 'WhatsApp reminders are sent from your device.' : '',
  }
}

export const mockInvoiceItems = () => mockDelay([...items], 250)

/** POST …/saved-items/ { description, default_price, default_tax_rate, account_code } */
export const mockCreateInvoiceItem = (body: { description: string; default_price: number; default_tax_rate: number; account_code: string }) => {
  if (!body.description.trim()) return Promise.reject(new Error('Description is required.'))
  const item: WireItem = {
    id: `i-${Date.now()}`, description: body.description, default_price: body.default_price.toFixed(2), default_tax_rate: body.default_tax_rate.toFixed(2),
    account_code: body.account_code, created_at: new Date().toISOString(),
  }
  items = [item, ...items]
  return mockDelay(item, 250)
}

export const mockDeleteInvoiceItem = (id: string) => {
  items = items.filter(item => item.id !== id)
  return mockDelay(null, 200)
}
