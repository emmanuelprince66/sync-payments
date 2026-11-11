import { mockDelay } from '@/lib/api-client'

/**
 * Sample data: the backend has no invoice endpoints yet. Swapping in real ones
 * means replacing these functions; hooks and screens stay as they are.
 */

/** Workflow status as saved. Whether money is still owed (Pending / Part paid / Overdue / Paid) is worked out by `invoicePaymentState`. */
export type InvoiceStatus = 'Draft' | 'Approved' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue'

/** The three printable invoice designs. */
export const INVOICE_DESIGNS = ['Classic', 'Ledger', 'Studio'] as const
export type InvoiceDesign = (typeof INVOICE_DESIGNS)[number]

export const INVOICE_PAYMENT_METHODS = ['Bank transfer', 'Cash', 'Card', 'POS', 'Other'] as const
export type InvoicePaymentMethod = (typeof INVOICE_PAYMENT_METHODS)[number]

export type InvoiceTaxMode = 'exclusive' | 'inclusive' | 'none'

/** A saved product or service, reusable across invoice lines. */
export type InvoiceItem = { id: string; code: string; name: string; description: string; price: number }

/** One line as saved: `amount` is qty × price less discount, `tax` the tax on it. */
export type InvoiceLineRecord = { description: string; qty: number; price: number; discount: number; taxRate: number; amount: number; tax: number }

export type InvoicePayment = {
  id: string
  amount: number
  /** ISO day the customer paid. */
  date: string
  method: InvoicePaymentMethod
  note: string
  recordedBy: string
  /** ISO timestamp. */
  recordedAt: string
}

export type InvoiceActivityType = 'created' | 'approved' | 'sent' | 'reminder' | 'payment' | 'paid'
export type InvoiceActivity = { id: string; type: InvoiceActivityType; message: string; by: string; at: string }

/** Branding the printable document is drawn with. */
export type InvoiceBranding = { accent: string; legalName: string; address: string; logoUrl: string }

export type Invoice = {
  /** The invoice number, e.g. INV-0001. */
  id: string
  client: string
  /** Total, tax included. */
  amount: number
  /** ISO dates. */
  issued: string
  due: string
  status: InvoiceStatus
  clientId: string
  clientEmail: string
  clientPhone: string
  reference: string
  taxMode: InvoiceTaxMode
  lines: InvoiceLineRecord[]
  subtotal: number
  tax: number
  design: InvoiceDesign
  branding: InvoiceBranding
  /** Sum of `payments`. */
  amountPaid: number
  payments: InvoicePayment[]
  activity: InvoiceActivity[]
  createdBy: string
  /** ISO timestamp. */
  createdAt: string
}

export type InvoiceAnalyticsMonth = { month: string; sent: number; paid: number }
export type DocumentFlowItem = { label: string; count: number; amount: number; color: string }

export type InvoiceSummary = {
  paidThisMonth: number
  paidChange: string
  averagePaidDays: string
  averagePaidChange: string
  collectionRate: string
  expectedCash: number
  months: InvoiceAnalyticsMonth[]
  flow: DocumentFlowItem[]
}

/** What the customer still owes and where the invoice stands, worked out from payments and the due date. */
export type InvoicePaymentState = 'Draft' | 'Pending' | 'Part paid' | 'Overdue' | 'Paid'

const round = (value: number) => Math.round(value * 100) / 100
const dayOffset = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const invoiceBalance = (invoice: Pick<Invoice, 'amount' | 'amountPaid'>) => Math.max(round(invoice.amount - (invoice.amountPaid ?? 0)), 0)

export const invoicePaymentState = (invoice: Pick<Invoice, 'status' | 'amount' | 'amountPaid' | 'due'>, today = dayOffset(0)): InvoicePaymentState => {
  if (invoice.status === 'Draft') return 'Draft'
  if (invoice.status === 'Paid' || invoiceBalance(invoice) <= 0) return 'Paid'
  if (invoice.due && invoice.due < today) return 'Overdue'
  return (invoice.amountPaid ?? 0) > 0 ? 'Part paid' : 'Pending'
}

// ---- Seed --------------------------------------------------------------------------------------

const stamp = (days: number, hour = 10) => `${dayOffset(days)}T${String(hour).padStart(2, '0')}:00:00`

const SEED_BRANDING: InvoiceBranding = { accent: '#529661', legalName: 'Kemi Store Ltd', address: '14 Admiralty Way, Lekki Phase 1, Lagos', logoUrl: '' }
const SEED_CREATOR = 'Kemi Adeyemi'

const line = (description: string, qty: number, price: number): InvoiceLineRecord => {
  const amount = round(qty * price)
  return { description, qty, price, discount: 0, taxRate: 7.5, amount, tax: round(amount * 0.075) }
}

type SeedInput = {
  id: string; clientId: string; client: string; email: string; phone: string; issuedDaysAgo: number; termDays: number
  status: InvoiceStatus; design: InvoiceDesign; accent: string; lines: InvoiceLineRecord[]; payments?: { amount: number; daysAgo: number; method: InvoicePaymentMethod }[]
}

const seed = (input: SeedInput): Invoice => {
  const subtotal = round(input.lines.reduce((sum, row) => sum + row.amount, 0))
  const tax = round(input.lines.reduce((sum, row) => sum + row.tax, 0))
  const payments: InvoicePayment[] = (input.payments ?? []).map((payment, index) => ({
    id: `${input.id}-p${index + 1}`, amount: payment.amount, date: dayOffset(-payment.daysAgo), method: payment.method, note: '', recordedBy: SEED_CREATOR, recordedAt: stamp(-payment.daysAgo, 14),
  }))
  const amountPaid = round(payments.reduce((sum, payment) => sum + payment.amount, 0))
  const activity: InvoiceActivity[] = [
    { id: `${input.id}-a1`, type: 'created' as const, message: 'Invoice created', by: SEED_CREATOR, at: stamp(-input.issuedDaysAgo, 9) },
    ...(input.status === 'Draft' ? [] : [{ id: `${input.id}-a2`, type: 'sent' as const, message: `Sent to ${input.client}`, by: SEED_CREATOR, at: stamp(-input.issuedDaysAgo, 10) }]),
    ...payments.map((payment, index) => ({ id: `${input.id}-a${index + 3}`, type: 'payment' as const, message: `Payment of ₦${payment.amount.toLocaleString()} recorded (${payment.method})`, by: SEED_CREATOR, at: payment.recordedAt })),
  ].reverse()
  return {
    id: input.id, client: input.client, amount: round(subtotal + tax), issued: dayOffset(-input.issuedDaysAgo), due: dayOffset(-input.issuedDaysAgo + input.termDays), status: input.status,
    clientId: input.clientId, clientEmail: input.email, clientPhone: input.phone, reference: '', taxMode: 'exclusive', lines: input.lines, subtotal, tax,
    design: input.design, branding: { ...SEED_BRANDING, accent: input.accent }, amountPaid, payments, activity, createdBy: SEED_CREATOR, createdAt: stamp(-input.issuedDaysAgo, 9),
  }
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

const summary: InvoiceSummary = {
  paidThisMonth: 48290,
  paidChange: '+16% from last month',
  averagePaidDays: '8.4 days',
  averagePaidChange: '2.1 days faster',
  collectionRate: '71%',
  expectedCash: 211480,
  months: [
    { month: 'Jan', sent: 38, paid: 25 },
    { month: 'Feb', sent: 54, paid: 40 },
    { month: 'Mar', sent: 47, paid: 42 },
    { month: 'Apr', sent: 68, paid: 51 },
    { month: 'May', sent: 72, paid: 61 },
    { month: 'Jun', sent: 88, paid: 69 },
  ],
  flow: [
    { label: 'Sales invoices sent', count: 38, amount: 92440, color: '#529661' },
    { label: 'Payments received', count: 31, amount: 65580, color: '#1D261C' },
    { label: 'Awaiting payment', count: 6, amount: 26860, color: '#D99A24' },
  ],
}

let items: InvoiceItem[] = [
  { id: 'i-1', code: 'CONSULT', name: 'Consulting (hourly)', description: 'Payment operations consulting, per hour', price: 45000 },
  { id: 'i-2', code: 'SETUP', name: 'Onboarding & setup', description: 'Account setup, terminal configuration and staff training', price: 150000 },
  { id: 'i-3', code: 'SUPPORT', name: 'Monthly support', description: 'Priority support retainer, billed monthly', price: 85000 },
]

const numberOf = (id: string) => Number(id.split('-')[1]) || 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const notFound = (id: string) => new Error(`Invoice ${id} was not found.`)

/** Next number in INV-0001 style. */
export const peekNextInvoiceNumber = () => `INV-${String(Math.max(0, ...invoices.map(invoice => numberOf(invoice.id))) + 1).padStart(4, '0')}`

export const getInvoices = () => mockDelay([...invoices])
export const getInvoice = (id: string) => {
  const found = invoices.find(invoice => invoice.id === id)
  return found ? mockDelay(found, 250) : Promise.reject(notFound(id))
}
export const getInvoiceSummary = () => mockDelay(summary)

export type CreateInvoiceInput = Omit<Invoice, 'status' | 'amountPaid' | 'payments' | 'activity' | 'createdAt'> & { status?: InvoiceStatus }

const ACTIVITY_ON_CREATE: Partial<Record<InvoiceStatus, (client: string) => { type: InvoiceActivityType; message: string }>> = {
  Approved: () => ({ type: 'approved', message: 'Approved' }),
  Sent: client => ({ type: 'sent', message: `Sent to ${client}` }),
}

/** Drafts and approved invoices keep their status; everything else goes out as Sent. Numbers are unique. */
export const createInvoice = ({ status = 'Sent', ...input }: CreateInvoiceInput) => {
  if (invoices.some(invoice => invoice.id.toLowerCase() === input.id.toLowerCase())) return Promise.reject(new Error(`${input.id} is already used. Choose another invoice number.`))
  const at = new Date().toISOString()
  const follow = ACTIVITY_ON_CREATE[status]?.(input.client)
  const created: InvoiceActivity = { id: newId('act'), type: 'created', message: 'Invoice created', by: input.createdBy, at }
  const invoice: Invoice = {
    ...input, status, amountPaid: 0, payments: [], createdAt: at,
    activity: follow ? [{ id: newId('act'), ...follow, by: input.createdBy, at }, created] : [created],
  }
  invoices = [invoice, ...invoices]
  return mockDelay(invoice)
}

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

export type RecordInvoicePaymentInput = { invoiceId: string; amount: number; date: string; method: InvoicePaymentMethod; note: string; recordedBy: string }

/** Adds a full or part payment. Paying off the balance marks the invoice Paid. */
export const recordInvoicePayment = ({ invoiceId, recordedBy, ...payment }: RecordInvoicePaymentInput) => update(invoiceId, invoice => {
  const balance = invoiceBalance(invoice)
  if (payment.amount <= 0 || payment.amount > balance + 0.001) throw new Error('Payment must be above zero and no more than the balance due.')
  const at = new Date().toISOString()
  const amountPaid = round(invoice.amountPaid + payment.amount)
  const paidOff = amountPaid >= invoice.amount - 0.001
  const entry: InvoicePayment = { id: newId('pay'), ...payment, recordedBy, recordedAt: at }
  const logged: InvoiceActivity[] = [
    ...(paidOff ? [{ id: newId('act'), type: 'paid' as const, message: 'Marked as paid in full', by: recordedBy, at }] : []),
    { id: newId('act'), type: 'payment', message: `Payment of ₦${payment.amount.toLocaleString()} recorded (${payment.method})`, by: recordedBy, at },
  ]
  return { ...invoice, amountPaid, status: paidOff ? 'Paid' : invoice.status === 'Draft' ? 'Sent' : invoice.status, payments: [entry, ...invoice.payments], activity: [...logged, ...invoice.activity] }
})

export type InvoiceReminderChannel = 'WhatsApp' | 'Email' | 'Share'

/** No messaging endpoint: the reminder goes out from the user's own WhatsApp or email, and only the log is kept here. */
export const logInvoiceReminder = ({ invoiceId, channel, by }: { invoiceId: string; channel: InvoiceReminderChannel; by: string }) => update(invoiceId, invoice => ({
  ...invoice,
  activity: [{ id: newId('act'), type: 'reminder', message: channel === 'Share' ? 'Reminder sent (shared from device)' : `Reminder sent via ${channel}`, by, at: new Date().toISOString() }, ...invoice.activity],
}))

export const getInvoiceItems = () => mockDelay([...items], 250)
export const createInvoiceItem = (input: Omit<InvoiceItem, 'id'>) => {
  const item: InvoiceItem = { ...input, id: `i-${Date.now()}` }
  items = [item, ...items]
  return mockDelay(item, 250)
}
