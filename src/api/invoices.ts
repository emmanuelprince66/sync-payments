import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest } from '@/lib/api-client'
import { requireBusinessId, useCurrentBusinessId } from './business'
import { apiFormRequest, asRecord, at, isLive, listFrom, num, str, type UnknownRecord } from './http'
import {
  INVOICE_DESIGNS, INVOICE_PAYMENT_METHODS, roundMoney,
  type CustomerInvoiceSummary, type DocumentFlowItem, type Invoice, type InvoiceActivity, type InvoiceActivityType, type InvoiceClientSnapshot, type InvoiceDesign,
  type InvoiceInput, type InvoiceItem, type InvoiceLineRecord, type InvoiceListParams, type InvoiceListResult, type InvoicePayment, type InvoicePaymentMethod,
  type InvoiceReminderChannel, type InvoiceReminderResult, type InvoiceStatus, type InvoiceSummary, type InvoiceTaxMode,
} from './invoice-model'
import { queryKeys } from './query-keys'
import * as mock from './sample/invoices'

export * from './invoice-model'

/**
 * Invoices (base `invoices/`). Mock mode (VITE_AUTH_MODE=mock) keeps everything on the sample store.
 *  GET    invoices/business/{business_id}/?status&customer&search&start_date&end_date&page&limit
 *  POST   invoices/business/{business_id}/                 create (server computes totals, assigns the number, snapshots client + branding)
 *  GET    invoices/business/{business_id}/next-number/     { next_number } (preview only)
 *  GET    invoices/business/{business_id}/analytics/
 *  GET    invoices/business/{business_id}/saved-items/     POST to add, DELETE …/saved-items/{item_id}/
 *  GET    invoices/{id}/                                   full detail
 *  PATCH  invoices/{id}/                                   any field while DRAFT; afterwards only { status: APPROVED → SENT }
 *  POST   invoices/{id}/payments/                          { amount, date, method, note }; DELETE …/payments/{payment_id}/ soft-reverses
 *  POST   invoices/{id}/reminders/                         { channel: email | whatsapp | share } → { send_succeeded }
 *  POST   invoices/{id}/logo/                              multipart `logo`, draft only
 *  GET    invoices/customers/{customer_id}/summary/        { total_paid, total_unpaid, overdue_amount, invoice_count }
 * Response field names are read tolerantly; anything important that is missing is logged once in development.
 */

export const INVOICES_PAGE_SIZE = 10

// ─── Errors ─────────────────────────────────────────────────────────────────

export const isInvoiceForbidden = (error: unknown) => error instanceof ApiError && error.status === 403

const NO_ACCESS = "You don't have permission to do this with invoices. Ask the business owner to give you invoice access."

/** First readable message in a DRF error body: `detail`, `message`, or the first field error. */
const fieldErrorText = (data: unknown): string => {
  for (const value of Object.values(asRecord(data))) {
    if (typeof value === 'string' && value) return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    const nested = Array.isArray(value) ? fieldErrorText(value[0]) : value && typeof value === 'object' ? fieldErrorText(value) : ''
    if (nested) return nested
  }
  return ''
}

/** A message people can act on: the backend's 403 wording for missing invoice rights, field errors for a rejected save. */
export const invoiceErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (error instanceof ApiError) {
    const record = asRecord(error.data)
    const own = str(record.detail) || str(record.message) || str(record.error)
    if (error.status === 403) return own || NO_ACCESS
    if (error.status === 400) return own || fieldErrorText(error.data) || fallback
    return own || error.message || fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}

const retryUnlessDenied = (count: number, error: unknown) => !(error instanceof ApiError && [400, 403, 404].includes(error.status)) && count < 2

// ─── Tolerant reading ───────────────────────────────────────────────────────

const firstOf = (record: unknown, paths: string[]): unknown => {
  for (const path of paths) {
    const value = at(record, path)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

const warned = new Set<string>()
/** First non-empty value at any of the paths; logs once in development when none is there. */
const pick = (record: unknown, scope: string, ...paths: string[]): unknown => {
  const value = firstOf(record, paths)
  const key = `${scope}:${paths[0]}`
  if (value === undefined && import.meta.env.DEV && !warned.has(key)) {
    warned.add(key)
    console.warn(`[invoices] ${scope} response has none of: ${paths.join(', ')}`)
  }
  return value
}
/** Same, without the warning, for fields that are often legitimately empty. */
const optional = (record: unknown, ...paths: string[]) => firstOf(record, paths)

/** `{ success, data: {...} }` or the bare object. */
const unwrap = (response: unknown): UnknownRecord => {
  const record = asRecord(response)
  const data = record.data
  return data && typeof data === 'object' && !Array.isArray(data) && !('line_items' in record) ? asRecord(data) : record
}

/** A person as a string, or { full_name | name | first_name + last_name | email }. */
const personName = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return str(value)
  const record = asRecord(value)
  return str(record.full_name) || str(record.name) || [str(record.first_name ?? record.firstname), str(record.last_name ?? record.lastname)].filter(Boolean).join(' ') || str(record.email)
}

const idOf = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? str(value) : str(asRecord(value).id))
const day = (value: unknown) => str(value).slice(0, 10)

// ─── Wire values ────────────────────────────────────────────────────────────

const STATUS_FROM_WIRE: Record<string, InvoiceStatus> = {
  DRAFT: 'Draft', APPROVED: 'Approved', SENT: 'Sent', VIEWED: 'Viewed', PAID: 'Paid', OVERDUE: 'Overdue', VOID: 'Void', VOIDED: 'Void', PARTIALLY_PAID: 'Sent', PART_PAID: 'Sent',
}

/** Choice values are sent upper-case like the status enum (DRAFT/APPROVED/SENT). */
const designToWire = (design: InvoiceDesign) => design.toUpperCase()
const designFromWire = (value: unknown): InvoiceDesign => INVOICE_DESIGNS.find(design => design.toLowerCase() === str(value).toLowerCase()) ?? 'Classic'
const taxModeToWire = (mode: InvoiceTaxMode) => mode.toUpperCase()
const taxModeFromWire = (value: unknown): InvoiceTaxMode => {
  const mode = str(value).toLowerCase()
  return mode === 'inclusive' || mode === 'none' ? mode : 'exclusive'
}
const methodToWire = (method: InvoicePaymentMethod) => method.toUpperCase().replace(/\s+/g, '_')
const methodFromWire = (value: unknown): InvoicePaymentMethod => {
  const wire = str(value).toUpperCase().replace(/[\s-]+/g, '_')
  return INVOICE_PAYMENT_METHODS.find(method => methodToWire(method) === wire) ?? (wire === 'TRANSFER' ? 'Bank transfer' : 'Other')
}

const ACTIVITY_FROM_WIRE: Record<string, InvoiceActivityType> = {
  CREATED: 'created', UPDATED: 'updated', EDITED: 'updated', APPROVED: 'approved', SENT: 'sent', VIEWED: 'viewed', REMINDER_SENT: 'reminder', REMINDER: 'reminder',
  PAYMENT_RECORDED: 'payment', PAYMENT: 'payment', PAYMENT_REVERSED: 'payment_reversed', PAID: 'paid', VOIDED: 'voided', VOID: 'voided',
}

// ─── Mapping ────────────────────────────────────────────────────────────────

const mapLine = (value: unknown): InvoiceLineRecord => {
  const record = asRecord(value)
  const qty = num(optional(record, 'quantity', 'qty'))
  const price = num(optional(record, 'unit_price', 'price'))
  const discount = num(record.discount_percent ?? record.discount)
  return {
    description: str(optional(record, 'description', 'name')),
    qty,
    price,
    discount,
    taxRate: num(record.tax_rate),
    account: str(record.account_code ?? record.account),
    itemId: idOf(record.item_id ?? record.item ?? record.saved_item),
    amount: num(optional(record, 'amount', 'line_total', 'total', 'net_amount') ?? roundMoney(qty * price * (1 - discount / 100))),
    tax: num(optional(record, 'tax_amount', 'tax', 'tax_total')),
  }
}

const mapPayment = (value: unknown, index: number): InvoicePayment => {
  const record = asRecord(value)
  const reversedAt = str(optional(record, 'reversed_at', 'deleted_at'))
  return {
    id: str(pick(record, 'payment', 'id', 'uuid')) || `payment-${index}`,
    amount: num(record.amount),
    date: day(optional(record, 'date', 'payment_date', 'paid_at', 'created_at')),
    method: methodFromWire(record.method ?? record.payment_method),
    note: str(record.note ?? record.notes),
    recordedBy: personName(optional(record, 'recorded_by_name', 'recorded_by', 'created_by_name', 'created_by')),
    recordedAt: str(optional(record, 'created_at', 'recorded_at', 'date')),
    reversed: record.is_reversed === true || record.reversed === true || Boolean(reversedAt) || str(record.status).toUpperCase() === 'REVERSED',
    reversedAt,
  }
}

const naira = (value: unknown) => `₦${num(value).toLocaleString()}`

const defaultActivityMessage = (type: InvoiceActivityType, meta: UnknownRecord, client: string) => {
  switch (type) {
    case 'created': return 'Invoice created'
    case 'updated': return 'Invoice edited'
    case 'approved': return 'Approved'
    case 'sent': return client ? `Sent to ${client}` : 'Marked as sent'
    case 'viewed': return client ? `Viewed by ${client}` : 'Viewed by the customer'
    case 'reminder': {
      const channel = str(meta.channel).toLowerCase()
      return channel === 'share' ? 'Reminder shared from device' : channel ? `Reminder sent via ${channel === 'whatsapp' ? 'WhatsApp' : 'email'}` : 'Reminder sent'
    }
    case 'payment': return meta.amount ? `Payment of ${naira(meta.amount)} recorded` : 'Payment recorded'
    case 'payment_reversed': return meta.amount ? `Payment of ${naira(meta.amount)} reversed` : 'Payment reversed'
    case 'paid': return 'Marked as paid in full'
    case 'voided': return 'Invoice voided'
  }
}

const mapActivity = (client: string) => (value: unknown, index: number): InvoiceActivity => {
  const record = asRecord(value)
  const wire = str(pick(record, 'activity', 'type', 'action', 'event', 'activity_type')).toUpperCase()
  const type = ACTIVITY_FROM_WIRE[wire] ?? 'updated'
  const meta = asRecord(record.metadata ?? record.meta ?? record.data)
  return {
    id: str(record.id) || `activity-${index}`,
    type,
    message: str(optional(record, 'message', 'description', 'note')) || defaultActivityMessage(type, meta, client),
    by: personName(optional(record, 'actor_name', 'actor', 'performed_by', 'user', 'by', 'created_by')) || (type === 'viewed' ? client : ''),
    at: str(pick(record, 'activity', 'created_at', 'timestamp', 'at', 'date')),
  }
}

/** A list row or a full detail. Rows have no lines, payments or activity; those stay empty until the detail loads. */
export const mapInvoice = (value: unknown): Invoice => {
  const record = unwrap(value)
  const client = asRecord(optional(record, 'client_details', 'client', 'client_snapshot', 'customer_details', 'customer'))
  const clientName = str(pick(record, 'invoice', 'client_name', 'customer_name', 'client_details.name', 'client.name', 'customer.name'))
  const payments = listFrom(record.payments, []).map(mapPayment)
  const activity = listFrom(optional(record, 'activity_log', 'activity', 'activities', 'logs'), []).map(mapActivity(clientName))
  const amount = num(pick(record, 'invoice', 'total', 'total_amount', 'amount'))
  const paidFromPayments = roundMoney(payments.filter(payment => !payment.reversed).reduce((sum, payment) => sum + payment.amount, 0))
  const amountPaid = num(optional(record, 'amount_paid', 'paid_amount', 'total_paid') ?? paidFromPayments)
  const balance = num(optional(record, 'balance', 'balance_due', 'amount_due') ?? Math.max(amount - amountPaid, 0))
  const wireStatus = str(pick(record, 'invoice', 'status')).toUpperCase()
  const viewed = wireStatus === 'VIEWED' || record.is_viewed === true || record.viewed === true || Boolean(record.viewed_at) || activity.some(entry => entry.type === 'viewed')
  const mapped = STATUS_FROM_WIRE[wireStatus] ?? 'Draft'
  const status: InvoiceStatus = mapped === 'Sent' && viewed ? 'Viewed' : mapped

  return {
    id: str(pick(record, 'invoice', 'id', 'uuid')),
    number: str(pick(record, 'invoice', 'number', 'invoice_number')),
    reference: str(record.reference),
    client: clientName,
    clientId: idOf(optional(record, 'customer_id', 'customer', 'client_id', 'client_details.id')),
    clientEmail: str(optional(record, 'client_email', 'customer_email') ?? client.email),
    clientPhone: str(optional(record, 'client_phone', 'customer_phone') ?? client.phone),
    clientAddress: str(optional(record, 'client_address') ?? client.address),
    amount,
    subtotal: num(optional(record, 'subtotal', 'sub_total') ?? amount),
    tax: num(optional(record, 'tax_total', 'tax', 'tax_amount')),
    amountPaid,
    balance,
    issued: day(pick(record, 'invoice', 'issue_date', 'issued_at', 'date')),
    due: day(pick(record, 'invoice', 'due_date', 'due_at')),
    status,
    viewed,
    taxMode: taxModeFromWire(record.tax_mode),
    design: designFromWire(record.design),
    branding: {
      accent: str(optional(record, 'brand_color', 'branding.brand_color', 'branding.color')) || '#529661',
      legalName: str(optional(record, 'legal_name', 'branding.legal_name', 'business_name')),
      address: str(optional(record, 'billing_address', 'branding.billing_address', 'branding.address')),
      logoUrl: str(optional(record, 'logo_url', 'branding.logo_url', 'logo')),
    },
    note: str(record.note ?? record.notes),
    lines: listFrom(optional(record, 'line_items', 'items', 'lines'), []).map(mapLine),
    payments,
    activity,
    publicUrl: str(optional(record, 'public_url', 'public_link', 'share_url')),
    createdBy: personName(optional(record, 'created_by_name', 'created_by')),
    createdAt: str(record.created_at),
  }
}

const toBody = (input: InvoiceInput) => ({
  customer: input.customerId,
  issue_date: input.issueDate,
  due_date: input.dueDate,
  tax_mode: taxModeToWire(input.taxMode),
  design: designToWire(input.design),
  brand_color: input.accent,
  legal_name: input.legalName,
  billing_address: input.address,
  note: input.note,
  line_items: input.lines.map(row => ({
    description: row.description,
    quantity: row.qty,
    unit_price: row.price,
    discount_percent: row.discount,
    tax_rate: row.taxRate,
    account_code: row.account,
    ...(row.itemId ? { item_id: row.itemId } : {}),
  })),
})

const mapItem = (value: unknown): InvoiceItem => {
  const record = unwrap(value)
  return {
    id: str(pick(record, 'saved item', 'id', 'uuid')),
    code: str(optional(record, 'code', 'item_code', 'sku')),
    name: str(pick(record, 'saved item', 'name', 'title', 'description')),
    description: str(record.description),
    price: num(optional(record, 'unit_price', 'price', 'rate')),
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────

type StatusFigure = { count: number; amount: number | null }

/** counts_by_status as { SENT: 4 }, { SENT: { count, amount } } or [{ status, count, amount }]. */
const statusFigures = (value: unknown): Record<string, StatusFigure> => {
  const figures: Record<string, StatusFigure> = {}
  const read = (status: string, entry: unknown) => {
    const record = asRecord(entry)
    const amount = optional(record, 'amount', 'total', 'total_amount', 'balance')
    figures[status.toUpperCase()] = typeof entry === 'number' || typeof entry === 'string' ? { count: num(entry), amount: null } : { count: num(record.count), amount: amount === undefined ? null : num(amount) }
  }
  if (Array.isArray(value)) value.forEach(entry => read(str(asRecord(entry).status), entry))
  else Object.entries(asRecord(value)).forEach(([status, entry]) => read(status, entry))
  return figures
}

const monthLabel = (value: unknown) => {
  const text = str(value)
  const date = /^\d{4}-\d{2}/.test(text) ? new Date(`${text.slice(0, 7)}-01T00:00:00`) : null
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-US', { month: 'short' }) : text.slice(0, 3)
}

const percentText = (value: unknown, suffix: string) => {
  if (value === undefined) return ''
  if (typeof value === 'string' && value.includes('%')) return `${value} ${suffix}`
  const n = num(value)
  return `${n > 0 ? '+' : ''}${Math.round(n * 10) / 10}% ${suffix}`
}

const mapAnalytics = (response: unknown): InvoiceSummary => {
  const root = unwrap(response)
  const counts = statusFigures(pick(root, 'analytics', 'counts_by_status', 'status_counts', 'counts', 'by_status'))
  const figure = (...statuses: string[]): StatusFigure => statuses.reduce<StatusFigure>((total, status) => {
    const entry = counts[status]
    return { count: total.count + (entry?.count ?? 0), amount: entry?.amount == null ? total.amount : (total.amount ?? 0) + entry.amount }
  }, { count: 0, amount: null })
  const open = figure('APPROVED', 'SENT', 'VIEWED', 'OVERDUE')
  const overdue = figure('OVERDUE')
  const expectedCash = num(pick(root, 'analytics', 'expected_cash', 'expected_cash_amount', 'expected'))
  const rate = num(pick(root, 'analytics', 'collection_rate', 'collection_rate_percent'))
  const days = pick(root, 'analytics', 'average_days_to_pay', 'avg_days_to_pay', 'average_paid_days')
  const months = listFrom(pick(root, 'analytics', 'monthly', 'months', 'sent_vs_paid', 'six_months', 'trend', 'chart'), []).map(entry => {
    const record = asRecord(entry)
    return {
      month: monthLabel(optional(record, 'label', 'month', 'period')),
      sent: num(optional(record, 'sent', 'sent_amount', 'invoiced', 'total_sent')),
      paid: num(optional(record, 'paid', 'paid_amount', 'collected', 'total_paid')),
    }
  })
  const flow: DocumentFlowItem[] = [
    { label: 'Drafts', ...figure('DRAFT'), color: '#9AABA3' },
    { label: 'Sent, awaiting payment', ...open, color: '#D99A24' },
    { label: 'Paid', ...figure('PAID'), color: '#1D261C' },
    { label: 'Overdue', ...overdue, color: '#C72D34' },
  ]
  return {
    outstanding: num(optional(root, 'outstanding', 'outstanding_amount', 'total_outstanding') ?? open.amount ?? expectedCash),
    outstandingCount: num(optional(root, 'outstanding_count') ?? open.count),
    overdue: num(optional(root, 'overdue_amount', 'overdue_total') ?? overdue.amount ?? 0),
    overdueCount: num(optional(root, 'overdue_count') ?? overdue.count),
    paidThisMonth: num(pick(root, 'analytics', 'paid_this_month', 'paid_this_month_amount', 'paid_month')),
    paidChange: percentText(optional(root, 'paid_change_percent', 'percent_change', 'paid_this_month_change', 'change_percent', 'paid_change'), 'from last month'),
    averagePaidDays: days === undefined ? '—' : `${Math.round(num(days) * 10) / 10} days`,
    collectionRate: `${Math.round(rate > 0 && rate <= 1 ? rate * 100 : rate)}%`,
    expectedCash,
    months,
    flow,
  }
}

// ─── Services ───────────────────────────────────────────────────────────────

const base = () => `invoices/business/${requireBusinessId()}`
const allParams = (page: number, limit: number): InvoiceListParams => ({ page, limit, search: '', status: '', customer: '', startDate: '', endDate: '' })

const listInvoices = async (params: InvoiceListParams): Promise<InvoiceListResult> => {
  if (!isLive()) return mock.mockListInvoices(params)
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.customer) query.set('customer', params.customer)
  if (params.startDate) query.set('start_date', params.startDate)
  if (params.endDate) query.set('end_date', params.endDate)
  const response = await apiRequest<unknown>(`${base()}/?${query.toString()}`)
  const invoices = listFrom(response, ['results.data', 'results', 'data.results', 'data']).map(mapInvoice)
  const total = num(optional(response, 'total', 'count', 'results.total', 'data.total')) || invoices.length
  const pages = num(optional(response, 'pages', 'total_pages', 'data.pages')) || Math.ceil(total / params.limit)
  return { invoices, total, pages: Math.max(1, pages) }
}

/** Everything matching the filters (up to 1,000 rows), for CSV export. */
export const fetchInvoicesForExport = async (filters: Omit<InvoiceListParams, 'page' | 'limit'>) => (await listInvoices({ ...filters, page: 1, limit: 1000 })).invoices

const getInvoice = async (id: string) => (isLive() ? mapInvoice(await apiRequest<unknown>(`invoices/${id}/`)) : mock.mockGetInvoice(id))

const getAnalytics = async () => (isLive() ? mapAnalytics(await apiRequest<unknown>(`${base()}/analytics/`)) : mock.mockInvoiceAnalytics())

const getNextNumber = async () => {
  if (!isLive()) return mock.mockNextInvoiceNumber()
  return str(pick(unwrap(await apiRequest<unknown>(`${base()}/next-number/`)), 'next-number', 'next_number', 'number'))
}

const getCustomerSummary = async (customerId: string): Promise<CustomerInvoiceSummary> => {
  if (!isLive()) return mock.mockCustomerSummary(customerId)
  const root = unwrap(await apiRequest<unknown>(`invoices/customers/${customerId}/summary/`))
  return {
    totalPaid: num(pick(root, 'customer summary', 'total_paid')),
    totalUnpaid: num(pick(root, 'customer summary', 'total_unpaid')),
    overdue: num(pick(root, 'customer summary', 'overdue_amount', 'overdue')),
    invoiceCount: num(pick(root, 'customer summary', 'invoice_count', 'count')),
  }
}

type Step = 'Approved' | 'Sent'

const patchStatus = (id: string, status: Step, by: string) =>
  isLive() ? apiRequest<unknown>(`invoices/${id}/`, { method: 'PATCH', body: { status: status.toUpperCase() } }) : mock.mockSetInvoiceStatus(id, status, by)

/** Drafts move Draft → Approved → Sent, one PATCH per step. */
const advance = async (id: string, from: InvoiceStatus, to: 'Draft' | Step, by: string) => {
  const steps: Step[] = to === 'Sent' ? ['Approved', 'Sent'] : to === 'Approved' ? ['Approved'] : []
  for (const step of steps) {
    if (from === 'Approved' && step === 'Approved') continue
    await patchStatus(id, step, by)
  }
}

const uploadLogo = (id: string, logo: { file: File; dataUrl: string }) => {
  if (!isLive()) return mock.mockUploadInvoiceLogo(id, logo.dataUrl)
  const form = new FormData()
  form.append('logo', logo.file)
  return apiFormRequest<unknown>(`invoices/${id}/logo/`, 'POST', form)
}

export type SaveInvoiceInput = {
  /** Present when editing a draft. */
  id?: string
  input: InvoiceInput
  status: 'Draft' | Step
  client: InvoiceClientSnapshot
  /** A newly picked logo; uploaded while the invoice is still a draft. */
  logo: { file: File; dataUrl: string } | null
  by: string
}
/** `warning` is set when the invoice saved but a later step (logo, approve, send) was refused. */
export type SaveInvoiceResult = { invoice: Invoice; warning: string }

/**
 * Create or edit. Without a logo a new invoice is created straight in its status; with one it is
 * created as a draft, the logo uploaded (drafts only), then moved on. Edits PATCH the fields first.
 */
const saveInvoice = async ({ id, input, status, client, logo, by }: SaveInvoiceInput): Promise<SaveInvoiceResult> => {
  let invoiceId = id ?? ''
  let from: InvoiceStatus = 'Draft'
  const direct = !id && !logo && isLive()
  if (id) {
    if (isLive()) await apiRequest<unknown>(`invoices/${id}/`, { method: 'PATCH', body: toBody(input) })
    else await mock.mockUpdateInvoice(id, { input, client, logoUrl: '', by })
  } else if (isLive()) {
    const created = mapInvoice(await apiRequest<unknown>(`${base()}/`, { method: 'POST', body: { ...toBody(input), status: (direct ? status : 'Draft').toUpperCase() } }))
    invoiceId = created.id
    if (direct) from = status
  } else {
    invoiceId = (await mock.mockCreateInvoice({ input, client, logoUrl: '', by })).id
  }
  if (!invoiceId) throw new Error("The invoice was saved but the server didn't return its id. Refresh the invoice list.")

  let warning = ''
  try {
    if (logo) await uploadLogo(invoiceId, logo)
    if (from !== status) await advance(invoiceId, from, status, by)
  } catch (error) {
    warning = invoiceErrorMessage(error, "Some changes after saving didn't go through.")
  }
  return { invoice: await getInvoice(invoiceId), warning }
}

export type RecordInvoicePaymentInput = mock.MockPaymentInput

const recordPayment = async (input: RecordInvoicePaymentInput) => {
  if (!isLive()) return mock.mockRecordPayment(input)
  await apiRequest<unknown>(`invoices/${input.invoiceId}/payments/`, { method: 'POST', body: { amount: input.amount, date: input.date, method: methodToWire(input.method), note: input.note } })
  return getInvoice(input.invoiceId)
}

const reversePayment = async (input: { invoiceId: string; paymentId: string; by: string }) => {
  if (!isLive()) return mock.mockReversePayment(input)
  await apiRequest<unknown>(`invoices/${input.invoiceId}/payments/${input.paymentId}/`, { method: 'DELETE' })
  return getInvoice(input.invoiceId)
}

const setStatus = async ({ id, status, by }: { id: string; status: Step; by: string }) => {
  await patchStatus(id, status, by)
  return getInvoice(id)
}

const sendReminder = async (input: { invoiceId: string; channel: InvoiceReminderChannel; by: string }): Promise<InvoiceReminderResult & { invoice: Invoice }> => {
  if (!isLive()) {
    const result = await mock.mockSendReminder(input)
    return { ...result, invoice: await mock.mockGetInvoice(input.invoiceId) }
  }
  const response = unwrap(await apiRequest<unknown>(`invoices/${input.invoiceId}/reminders/`, { method: 'POST', body: { channel: input.channel } }))
  return {
    sendSucceeded: input.channel === 'share' || optional(response, 'send_succeeded', 'sent') === true,
    message: str(optional(response, 'send_error', 'error', 'message', 'detail')),
    invoice: await getInvoice(input.invoiceId),
  }
}

const getItems = async () => (isLive() ? listFrom(await apiRequest<unknown>(`${base()}/saved-items/`), ['results.data', 'results', 'data']).map(mapItem) : mock.mockInvoiceItems())

const createItem = async (input: Omit<InvoiceItem, 'id'>): Promise<InvoiceItem> => {
  if (!isLive()) return mock.mockCreateInvoiceItem(input)
  const created = mapItem(await apiRequest<unknown>(`${base()}/saved-items/`, { method: 'POST', body: { code: input.code, name: input.name, description: input.description, unit_price: input.price } }))
  return { id: created.id, code: created.code || input.code, name: created.name || input.name, description: created.description || input.description, price: created.price || input.price }
}

const deleteItem = async (id: string) => (isLive() ? apiRequest<unknown>(`${base()}/saved-items/${id}/`, { method: 'DELETE' }) : mock.mockDeleteInvoiceItem(id))

// ─── Hooks ──────────────────────────────────────────────────────────────────

const detailKey = (id: string) => [...queryKeys.invoices, 'detail', id] as const
const itemsKey = [...queryKeys.invoices, 'items'] as const

/** Lists, analytics, next number and customer figures; not the open detail (set directly) or saved items. */
const refreshAround = (queryClient: QueryClient) => queryClient.invalidateQueries({
  predicate: query => query.queryKey[0] === queryKeys.invoices[0] && query.queryKey[1] !== 'detail' && query.queryKey[1] !== 'items',
})

const useBusinessScope = () => {
  const { businessId } = useCurrentBusinessId()
  return { scope: isLive() ? businessId : 'mock', ready: !isLive() || Boolean(businessId) }
}

/** Server-paged, filtered invoice list. */
export const useInvoices = ({ enabled = true, ...filters }: Partial<InvoiceListParams> & { enabled?: boolean } = {}) => {
  const params: InvoiceListParams = { ...allParams(1, INVOICES_PAGE_SIZE), ...filters }
  const { scope, ready } = useBusinessScope()
  return useQuery({
    queryKey: [...queryKeys.invoices, 'list', scope, params],
    queryFn: () => listInvoices(params),
    enabled: enabled && ready,
    placeholderData: keepPreviousData,
    retry: retryUnlessDenied,
  })
}

const ALL_PAGE_SIZE = 200
const ALL_MAX_PAGES = 5

/**
 * Every invoice (up to 1,000), for per-customer figures on the Customers list: one paged
 * walk of the list endpoint instead of a summary request per customer row.
 */
export const useAllInvoices = () => {
  const { scope, ready } = useBusinessScope()
  return useQuery({
    queryKey: [...queryKeys.invoices, 'all', scope],
    queryFn: async () => {
      const first = await listInvoices(allParams(1, ALL_PAGE_SIZE))
      const more = await Promise.all(Array.from({ length: Math.min(first.pages, ALL_MAX_PAGES) - 1 }, (_, index) => listInvoices(allParams(index + 2, ALL_PAGE_SIZE))))
      return { invoices: [...first.invoices, ...more.flatMap(page => page.invoices)], complete: first.pages <= ALL_MAX_PAGES }
    },
    enabled: ready,
    staleTime: 60_000,
    retry: retryUnlessDenied,
  })
}

/** One invoice with its lines, payments and activity. */
export const useInvoice = (id: string | undefined) => useQuery({ queryKey: detailKey(id ?? ''), queryFn: () => getInvoice(id ?? ''), enabled: Boolean(id), retry: retryUnlessDenied })

export const useInvoiceAnalytics = () => {
  const { scope, ready } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.invoices, 'analytics', scope], queryFn: getAnalytics, enabled: ready, retry: retryUnlessDenied })
}

/** Preview of the number the next invoice will get; the server assigns it on save. */
export const useNextInvoiceNumber = (enabled = true) => {
  const { scope, ready } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.invoices, 'next-number', scope], queryFn: getNextNumber, enabled: enabled && ready, retry: retryUnlessDenied })
}

export const useCustomerInvoiceSummary = (customerId: string | undefined) => useQuery({
  queryKey: [...queryKeys.invoices, 'customer-summary', customerId],
  queryFn: () => getCustomerSummary(customerId as string),
  enabled: Boolean(customerId),
  retry: retryUnlessDenied,
})

/** Writes the fresh invoice into its detail cache and refreshes everything derived from it. */
const useInvoiceMutation = <Input, Output>(mutationFn: (input: Input) => Promise<Output>, invoiceOf: (output: Output) => Invoice) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: output => {
      const invoice = invoiceOf(output)
      queryClient.setQueryData(detailKey(invoice.id), invoice)
      return refreshAround(queryClient)
    },
  })
}

export const useSaveInvoice = () => useInvoiceMutation(saveInvoice, result => result.invoice)
export const useSetInvoiceStatus = () => useInvoiceMutation(setStatus, invoice => invoice)
/** Records a full or part payment; a paid-off invoice becomes Paid. */
export const useRecordInvoicePayment = () => useInvoiceMutation(recordPayment, invoice => invoice)
/** Soft-reverses a payment: it stays in the history, and a Paid invoice goes back to Sent. */
export const useReverseInvoicePayment = () => useInvoiceMutation(reversePayment, invoice => invoice)
/** Logs the reminder on the invoice; email is sent by the server, WhatsApp/share go from the device. */
export const useSendInvoiceReminder = () => useInvoiceMutation(sendReminder, result => result.invoice)

/** Saved items for invoice lines. */
export const useInvoiceItems = () => {
  const { scope, ready } = useBusinessScope()
  return useQuery({ queryKey: [...itemsKey, scope], queryFn: getItems, enabled: ready, retry: retryUnlessDenied })
}

export const useCreateInvoiceItem = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: createItem, onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey }) })
}

export const useDeleteInvoiceItem = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: deleteItem, onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey }) })
}
