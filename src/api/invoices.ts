import { useMutation, useQuery, useQueryClient, keepPreviousData, type QueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest } from '@/lib/api-client'
import { requireBusinessId, useCurrentBusinessId } from './business'
import { apiFormRequest, asRecord, at, isLive, listFrom, num, str, type UnknownRecord } from './http'
import {
  INVOICE_DESIGNS, roundMoney,
  type CustomerInvoiceSummaries, type CustomerInvoiceSummary, type DocumentFlowItem, type Invoice, type InvoiceActivity, type InvoiceActivityType, type InvoiceClientSnapshot,
  type InvoiceDesign, type InvoiceInput, type InvoiceItem, type InvoiceItemInput, type InvoiceLineRecord, type InvoiceListParams, type InvoiceListResult, type InvoicePayment,
  type InvoicePaymentMethod, type InvoiceReminderChannel, type InvoiceReminderResult, type InvoiceStatus, type InvoiceSummary, type InvoiceTaxMode,
} from './invoice-model'
import { queryKeys } from './query-keys'
import * as mock from './sample/invoices'

export * from './invoice-model'

/**
 * Invoices (base `invoices/`). Mock mode (VITE_AUTH_MODE=mock) keeps everything on the sample store,
 * which answers analytics, summaries, reminders, saved items and next-number in the wire shapes below
 * so the same mappers run in both modes.
 *  GET    invoices/business/{business_id}/?status&customer&search&start_date&end_date&page&limit
 *           → { links: { next, previous }, total, limit, pages, results: [row] } (VOID excluded)
 *  POST   invoices/business/{business_id}/                 JSON, or multipart with `logo` (then `line_items` is a JSON string).
 *                                                           The server assigns `number` and `reference`; we never send them.
 *  GET    invoices/business/{business_id}/next-number/     { next_number }
 *  GET    invoices/business/{business_id}/analytics/
 *  GET    invoices/business/{business_id}/customer-summaries/?customer_ids=a,b
 *           → { results: [{ customer_id, total_paid, total_unpaid, overdue_amount, invoice_count }] }
 *  GET    invoices/business/{business_id}/saved-items/     [{ id, description, default_price, default_tax_rate, account_code, created_at }]
 *  POST   invoices/business/{business_id}/saved-items/     { description, default_price, default_tax_rate, account_code }; DELETE …/{item_id}/
 *  GET    invoices/{id}/                                   full detail
 *  PATCH  invoices/{id}/                                   any field (and `logo`, multipart) while DRAFT; afterwards only { status: APPROVED → SENT }
 *  POST   invoices/{id}/payments/                          { amount, date, method, note }; DELETE …/payments/{payment_id}/ soft-reverses
 *  POST   invoices/{id}/reminders/                         { channel } → { channel, public_url, send_attempted, send_succeeded, send_message }
 *  GET    invoices/customers/{customer_id}/summary/        { total_paid, total_unpaid, overdue_amount, invoice_count }
 */

export const INVOICES_PAGE_SIZE = 10

// ─── Errors ─────────────────────────────────────────────────────────────────

export const isInvoiceForbidden = (error: unknown) => error instanceof ApiError && error.status === 403

const NO_ACCESS = "You don't have permission to do this with invoices. Ask the business owner to give you invoice access."

/** First readable message in a DRF error body: the first field error. */
const fieldErrorText = (data: unknown): string => {
  for (const value of Object.values(asRecord(data))) {
    if (typeof value === 'string' && value) return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    const nested = Array.isArray(value) ? fieldErrorText(value[0]) : value && typeof value === 'object' ? fieldErrorText(value) : ''
    if (nested) return nested
  }
  return ''
}

/** A message people can act on: validation errors come back as HTTP 400 `{ message }`, the 403 wording for missing invoice rights. */
export const invoiceErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (error instanceof ApiError) {
    const record = asRecord(error.data)
    const own = str(record.message) || str(record.detail) || str(record.error)
    if (error.status === 403) return own || NO_ACCESS
    if (error.status === 400) return own || fieldErrorText(error.data) || fallback
    return own || error.message || fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}

const retryUnlessDenied = (count: number, error: unknown) => !(error instanceof ApiError && [400, 403, 404].includes(error.status)) && count < 2

// ─── Reading ────────────────────────────────────────────────────────────────

const warned = new Set<string>()
/** The value at `path`; logs once in development when a field the contract promises is missing. */
const field = (record: unknown, scope: string, path: string): unknown => {
  const value = at(record, path)
  if ((value === undefined || value === null || value === '') && import.meta.env.DEV && !warned.has(`${scope}:${path}`)) {
    warned.add(`${scope}:${path}`)
    console.warn(`[invoices] ${scope} response has no ${path}`)
  }
  return value
}

/** The bare object, or `{ data: {...} }` if a response is ever wrapped. */
const unwrap = (response: unknown): UnknownRecord => {
  const record = asRecord(response)
  return 'data' in record && record.data && typeof record.data === 'object' && !Array.isArray(record.data) ? asRecord(record.data) : record
}

const day = (value: unknown) => str(value).slice(0, 10)
const nullableNumber = (value: unknown) => (value === null || value === undefined || value === '' ? null : num(value))

// ─── Wire values ────────────────────────────────────────────────────────────

const STATUS_FROM_WIRE: Record<string, InvoiceStatus> = {
  DRAFT: 'Draft', APPROVED: 'Approved', SENT: 'Sent', VIEWED: 'Viewed', PAID: 'Paid', OVERDUE: 'Overdue', VOID: 'Void',
}

/** `design` is lowercase on the wire: classic / ledger / studio. */
const designToWire = (design: InvoiceDesign) => design.toLowerCase()
const designFromWire = (value: unknown): InvoiceDesign => INVOICE_DESIGNS.find(design => design.toLowerCase() === str(value).toLowerCase()) ?? 'Classic'

/** `tax_mode`: EXCLUSIVE / INCLUSIVE / NONE. */
const taxModeToWire = (mode: InvoiceTaxMode) => mode.toUpperCase()
const taxModeFromWire = (value: unknown): InvoiceTaxMode => {
  const mode = str(value).toLowerCase()
  return mode === 'inclusive' || mode === 'none' ? mode : 'exclusive'
}

/** Payment `method`: BANK_TRANSFER / CASH / CARD / POS / OTHER. */
const METHOD_TO_WIRE: Record<InvoicePaymentMethod, string> = { 'Bank transfer': 'BANK_TRANSFER', Cash: 'CASH', Card: 'CARD', POS: 'POS', Other: 'OTHER' }
const methodFromWire = (value: unknown): InvoicePaymentMethod =>
  (Object.entries(METHOD_TO_WIRE) as [InvoicePaymentMethod, string][]).find(([, wire]) => wire === str(value).toUpperCase())?.[0] ?? 'Other'

const ACTIVITY_FROM_WIRE: Record<string, InvoiceActivityType> = {
  CREATED: 'created', APPROVED: 'approved', SENT: 'sent', VIEWED: 'viewed', REMINDER_SENT: 'reminder',
  PAYMENT_RECORDED: 'payment', PAYMENT_REVERSED: 'payment_reversed', PAID: 'paid', VOIDED: 'voided',
}

// ─── Mapping ────────────────────────────────────────────────────────────────

const mapLine = (value: unknown): InvoiceLineRecord => {
  const record = asRecord(value)
  const qty = num(record.quantity)
  const price = num(record.unit_price)
  const discount = num(record.discount_percent)
  return {
    description: str(record.description),
    qty,
    price,
    discount,
    taxRate: num(record.tax_rate),
    account: str(record.account_code),
    itemId: str(record.item_id),
    amount: record.line_amount == null ? roundMoney(qty * price * (1 - discount / 100)) : num(record.line_amount),
    tax: num(record.line_tax),
  }
}

/** Lines in `sort_order`. */
const mapLines = (value: unknown) => listFrom(value, [])
  .map((entry, index) => ({ entry, order: asRecord(entry).sort_order == null ? index : num(asRecord(entry).sort_order) }))
  .sort((a, b) => a.order - b.order)
  .map(({ entry }) => mapLine(entry))

const mapPayment = (value: unknown, index: number): InvoicePayment => {
  const record = asRecord(value)
  return {
    id: str(field(record, 'payment', 'id')) || `payment-${index}`,
    amount: num(record.amount),
    date: day(record.date),
    method: methodFromWire(record.method),
    note: str(record.note),
    recordedBy: str(record.recorded_by_name),
    recordedAt: str(record.created_at),
    reversed: record.is_reversed === true,
    reversedAt: str(record.reversed_at),
    reversedBy: str(record.reversed_by_name),
  }
}

const naira = (value: unknown) => `₦${num(value).toLocaleString()}`
const CHANNEL_NAME: Record<string, string> = { email: 'email', whatsapp: 'WhatsApp', share: 'the share sheet' }

/** Reminder wording from `context.channel / send_attempted / send_succeeded / send_message`. */
const reminderText = (context: UnknownRecord) => {
  const channel = str(context.channel).toLowerCase()
  const reason = str(context.send_message)
  if (channel === 'share') return 'Reminder shared from device'
  if (context.send_succeeded === true) return channel === 'email' ? 'Reminder emailed' : `Reminder sent via ${CHANNEL_NAME[channel] ?? channel}`
  if (channel === 'whatsapp' && context.send_attempted !== true) return 'WhatsApp reminder opened on device'
  if (context.send_succeeded === false) return `Reminder ${channel === 'email' ? 'email' : `via ${CHANNEL_NAME[channel] ?? channel}`} failed${reason ? `: ${reason}` : ''}`
  return channel ? `Reminder via ${CHANNEL_NAME[channel] ?? channel}` : 'Reminder sent'
}

const activityText = (type: InvoiceActivityType, context: UnknownRecord, client: string) => {
  switch (type) {
    case 'created': return 'Invoice created'
    case 'updated': return 'Invoice updated'
    case 'approved': return 'Approved'
    case 'sent': return client ? `Sent to ${client}` : 'Marked as sent'
    case 'viewed': return client ? `Viewed by ${client}` : 'Viewed by the customer'
    case 'reminder': return reminderText(context)
    case 'payment': return context.amount != null ? `Payment of ${naira(context.amount)} recorded` : 'Payment recorded'
    case 'payment_reversed': return context.amount != null ? `Payment of ${naira(context.amount)} reversed` : 'Payment reversed'
    case 'paid': return 'Paid in full'
    case 'voided': return 'Invoice voided'
  }
}

const mapActivity = (client: string) => (value: unknown, index: number): InvoiceActivity => {
  const record = asRecord(value)
  const type = ACTIVITY_FROM_WIRE[str(field(record, 'activity', 'action')).toUpperCase()] ?? 'updated'
  return {
    id: str(record.id) || `activity-${index}`,
    type,
    message: activityText(type, asRecord(record.context), client),
    by: str(record.performed_by_name) || (type === 'viewed' ? client : ''),
    at: str(field(record, 'activity', 'created_at')),
  }
}

/** A list row or a full detail. Rows have no lines, payments or activity; those stay empty until the detail loads. */
export const mapInvoice = (value: unknown): Invoice => {
  const record = unwrap(value)
  const client = str(field(record, 'invoice', 'client_name'))
  const payments = listFrom(record.payments, []).map(mapPayment)
  const amount = num(field(record, 'invoice', 'total'))
  const amountPaid = num(field(record, 'invoice', 'amount_paid'))
  const viewedAt = str(record.viewed_at)
  const wireStatus = str(field(record, 'invoice', 'status')).toUpperCase()
  const viewed = wireStatus === 'VIEWED' || Boolean(viewedAt)
  const mapped = STATUS_FROM_WIRE[wireStatus] ?? 'Draft'

  return {
    id: str(field(record, 'invoice', 'id')),
    number: str(field(record, 'invoice', 'number')),
    reference: str(record.reference),
    client,
    clientId: str(record.customer),
    clientEmail: str(record.client_email),
    clientPhone: str(record.client_phone),
    amount,
    subtotal: record.subtotal == null ? amount : num(record.subtotal),
    tax: num(record.tax_total),
    amountPaid,
    balance: record.balance == null ? Math.max(roundMoney(amount - amountPaid), 0) : num(record.balance),
    issued: day(field(record, 'invoice', 'issue_date')),
    due: day(field(record, 'invoice', 'due_date')),
    status: mapped === 'Sent' && viewed ? 'Viewed' : mapped,
    viewed,
    viewedAt,
    taxMode: taxModeFromWire(record.tax_mode),
    design: designFromWire(record.design),
    branding: {
      accent: str(record.brand_color) || '#529661',
      legalName: str(record.legal_name),
      address: str(record.billing_address),
      logoUrl: str(record.logo_url),
    },
    note: str(record.note),
    lines: mapLines(record.line_items),
    payments,
    activity: listFrom(record.activity_log, []).map(mapActivity(client)),
    publicUrl: str(record.public_url),
    createdBy: str(record.created_by_name),
    createdAt: str(record.created_at),
  }
}

/** JSON body for create / edit. `number` and `reference` are the server's. */
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
  line_items: input.lines.map((row, index) => ({
    description: row.description,
    quantity: row.qty,
    unit_price: row.price,
    discount_percent: row.discount,
    tax_rate: row.taxRate,
    account_code: row.account,
    sort_order: index,
    ...(row.itemId ? { item_id: row.itemId } : {}),
  })),
})

/** Multipart version for when a logo goes along: `line_items` is sent as a JSON string. */
const toForm = (body: UnknownRecord, logo: File) => {
  const form = new FormData()
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue
    form.append(key, key === 'line_items' ? JSON.stringify(value) : String(value))
  }
  form.append('logo', logo)
  return form
}

const writeInvoice = (path: string, method: 'POST' | 'PATCH', body: UnknownRecord, logo: File | null) =>
  logo ? apiFormRequest<unknown>(path, method, toForm(body, logo)) : apiRequest<unknown>(path, { method, body })

const mapItem = (value: unknown): InvoiceItem => {
  const record = unwrap(value)
  return {
    id: str(field(record, 'saved item', 'id')),
    description: str(field(record, 'saved item', 'description')),
    price: num(record.default_price),
    taxRate: num(record.default_tax_rate),
    account: str(record.account_code),
    createdAt: str(record.created_at),
  }
}

const mapCustomerSummary = (record: unknown): CustomerInvoiceSummary => ({
  totalPaid: num(field(record, 'customer summary', 'total_paid')),
  totalUnpaid: num(field(record, 'customer summary', 'total_unpaid')),
  overdue: num(field(record, 'customer summary', 'overdue_amount')),
  invoiceCount: num(field(record, 'customer summary', 'invoice_count')),
})

const mapReminder = (channel: InvoiceReminderChannel, value: unknown): InvoiceReminderResult => {
  const record = unwrap(value)
  const wireChannel = str(record.channel).toLowerCase()
  return {
    channel: wireChannel === 'email' || wireChannel === 'whatsapp' || wireChannel === 'share' ? wireChannel : channel,
    publicUrl: str(record.public_url),
    sendAttempted: record.send_attempted === true,
    sendSucceeded: typeof record.send_succeeded === 'boolean' ? record.send_succeeded : null,
    message: str(record.send_message),
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────

const monthLabel = (value: unknown) => {
  const text = str(value)
  const date = /^\d{4}-\d{2}/.test(text) ? new Date(`${text.slice(0, 7)}-01T00:00:00`) : null
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-US', { month: 'short' }) : text
}

const oneDecimal = (value: number) => Math.round(value * 10) / 10

/** Exact keys: paid_this_month, change_from_last_month_pct, average_days_to_pay, collection_rate_pct, expected_cash, counts_by_status, monthly_sent_vs_paid. */
const mapAnalytics = (response: unknown): InvoiceSummary => {
  const root = unwrap(response)
  const counts = asRecord(field(root, 'analytics', 'counts_by_status'))
  const count = (...statuses: string[]) => statuses.reduce((total, status) => total + num(counts[status]), 0)
  const change = nullableNumber(root.change_from_last_month_pct)
  const days = nullableNumber(root.average_days_to_pay)
  const rate = nullableNumber(root.collection_rate_pct)
  const flow: DocumentFlowItem[] = [
    { label: 'Drafts', count: count('DRAFT'), amount: null, color: '#9AABA3' },
    { label: 'Approved, not sent', count: count('APPROVED'), amount: null, color: '#6E8B7B' },
    { label: 'Sent, awaiting payment', count: count('SENT', 'VIEWED'), amount: null, color: '#D99A24' },
    { label: 'Overdue', count: count('OVERDUE'), amount: null, color: '#C72D34' },
    { label: 'Paid', count: count('PAID'), amount: null, color: '#1D261C' },
    { label: 'Void', count: count('VOID'), amount: null, color: '#C3CCC7' },
  ]
  return {
    outstandingCount: count('APPROVED', 'SENT', 'VIEWED', 'OVERDUE'),
    overdueCount: count('OVERDUE'),
    paidThisMonth: num(field(root, 'analytics', 'paid_this_month')),
    paidChange: change === null ? '—' : `${change > 0 ? '+' : ''}${oneDecimal(change)}% from last month`,
    averagePaidDays: days === null ? '—' : `${oneDecimal(days)} days`,
    collectionRate: rate === null ? '—' : `${oneDecimal(rate)}%`,
    expectedCash: num(field(root, 'analytics', 'expected_cash')),
    months: listFrom(field(root, 'analytics', 'monthly_sent_vs_paid'), []).map(entry => {
      const record = asRecord(entry)
      return { month: monthLabel(record.month), sent: num(record.sent), paid: num(record.paid) }
    }),
    flow,
  }
}

// ─── Services ───────────────────────────────────────────────────────────────

const base = () => `invoices/business/${requireBusinessId()}`

const listInvoices = async (params: InvoiceListParams): Promise<InvoiceListResult> => {
  if (!isLive()) return mock.mockListInvoices(params)
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.customer) query.set('customer', params.customer)
  if (params.startDate) query.set('start_date', params.startDate)
  if (params.endDate) query.set('end_date', params.endDate)
  const response = asRecord(await apiRequest<unknown>(`${base()}/?${query.toString()}`))
  const invoices = listFrom(field(response, 'invoice list', 'results'), []).map(mapInvoice)
  const total = num(response.total) || invoices.length
  const pages = num(response.pages) || Math.ceil(total / params.limit)
  return { invoices, total, pages: Math.max(1, pages) }
}

/** Everything matching the filters (up to 1,000 rows), for CSV export. */
export const fetchInvoicesForExport = async (filters: Omit<InvoiceListParams, 'page' | 'limit'>) => (await listInvoices({ ...filters, page: 1, limit: 1000 })).invoices

const getInvoice = async (id: string) => (isLive() ? mapInvoice(await apiRequest<unknown>(`invoices/${id}/`)) : mock.mockGetInvoice(id))

const getAnalytics = async () => mapAnalytics(isLive() ? await apiRequest<unknown>(`${base()}/analytics/`) : await mock.mockInvoiceAnalytics())

const getNextNumber = async () => str(field(unwrap(isLive() ? await apiRequest<unknown>(`${base()}/next-number/`) : await mock.mockNextInvoiceNumber()), 'next-number', 'next_number'))

const getCustomerSummary = async (customerId: string) =>
  mapCustomerSummary(unwrap(isLive() ? await apiRequest<unknown>(`invoices/customers/${customerId}/summary/`) : await mock.mockCustomerSummary(customerId)))

const getCustomerSummaries = async (customerIds: string[]): Promise<CustomerInvoiceSummaries> => {
  const response = isLive()
    ? await apiRequest<unknown>(`${base()}/customer-summaries/?customer_ids=${customerIds.map(encodeURIComponent).join(',')}`)
    : await mock.mockCustomerSummaries(customerIds)
  const summaries: CustomerInvoiceSummaries = {}
  for (const row of listFrom(field(response, 'customer summaries', 'results'), [])) summaries[str(asRecord(row).customer_id)] = mapCustomerSummary(row)
  return summaries
}

type Step = 'Approved' | 'Sent'

const patchStatus = (id: string, status: Step, by: string) =>
  isLive() ? apiRequest<unknown>(`invoices/${id}/`, { method: 'PATCH', body: { status: status.toUpperCase() } }) : mock.mockSetInvoiceStatus(id, status, by)

/** An edited draft moves Draft → Approved → Sent, one PATCH per step. */
const advance = async (id: string, to: 'Draft' | Step, by: string) => {
  const steps: Step[] = to === 'Sent' ? ['Approved', 'Sent'] : to === 'Approved' ? ['Approved'] : []
  for (const step of steps) await patchStatus(id, step, by)
}

export type SaveInvoiceInput = {
  /** Present when editing a draft. */
  id?: string
  input: InvoiceInput
  status: 'Draft' | Step
  client: InvoiceClientSnapshot
  /** A newly picked logo; sent with the create / edit itself (multipart). */
  logo: { file: File; dataUrl: string } | null
  by: string
}
/** `warning` is set when an edited draft saved but moving it on (approve, send) was refused. */
export type SaveInvoiceResult = { invoice: Invoice; warning: string }

/**
 * New invoices are created in one call, straight in their status, logo included. Edits PATCH the
 * draft's fields (logo included), then move it on.
 */
const saveInvoice = async ({ id, input, status, client, logo, by }: SaveInvoiceInput): Promise<SaveInvoiceResult> => {
  if (!id) {
    if (!isLive()) return { invoice: await mock.mockCreateInvoice({ input, client, logoUrl: logo?.dataUrl ?? '', by, status }), warning: '' }
    const created = mapInvoice(await writeInvoice(`${base()}/`, 'POST', { ...toBody(input), status: status.toUpperCase() }, logo?.file ?? null))
    if (!created.id) throw new Error("The invoice was saved but the server didn't return its id. Refresh the invoice list.")
    return { invoice: created.lines.length ? created : await getInvoice(created.id), warning: '' }
  }

  if (isLive()) await writeInvoice(`invoices/${id}/`, 'PATCH', toBody(input), logo?.file ?? null)
  else await mock.mockUpdateInvoice(id, { input, client, logoUrl: logo?.dataUrl ?? '', by })
  let warning = ''
  try {
    await advance(id, status, by)
  } catch (error) {
    warning = invoiceErrorMessage(error, "The draft saved, but it couldn't be moved on.")
  }
  return { invoice: await getInvoice(id), warning }
}

export type RecordInvoicePaymentInput = mock.MockPaymentInput

const recordPayment = async (input: RecordInvoicePaymentInput) => {
  if (!isLive()) return mock.mockRecordPayment(input)
  await apiRequest<unknown>(`invoices/${input.invoiceId}/payments/`, { method: 'POST', body: { amount: input.amount, date: input.date, method: METHOD_TO_WIRE[input.method], note: input.note } })
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
  const response = isLive()
    ? await apiRequest<unknown>(`invoices/${input.invoiceId}/reminders/`, { method: 'POST', body: { channel: input.channel } })
    : await mock.mockSendReminder(input)
  return { ...mapReminder(input.channel, response), invoice: await getInvoice(input.invoiceId) }
}

const getItems = async () => listFrom(isLive() ? await apiRequest<unknown>(`${base()}/saved-items/`) : await mock.mockInvoiceItems(), ['results']).map(mapItem)

const createItem = async (input: InvoiceItemInput): Promise<InvoiceItem> => {
  const body = { description: input.description, default_price: input.price, default_tax_rate: input.taxRate, account_code: input.account }
  const created = mapItem(isLive() ? await apiRequest<unknown>(`${base()}/saved-items/`, { method: 'POST', body }) : await mock.mockCreateInvoiceItem(body))
  return { ...input, ...created, description: created.description || input.description }
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
  const params: InvoiceListParams = { page: 1, limit: INVOICES_PAGE_SIZE, search: '', status: '', customer: '', startDate: '', endDate: '', ...filters }
  const { scope, ready } = useBusinessScope()
  return useQuery({
    queryKey: [...queryKeys.invoices, 'list', scope, params],
    queryFn: () => listInvoices(params),
    enabled: enabled && ready,
    placeholderData: keepPreviousData,
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

/** One customer's totals, for the customer detail page. */
export const useCustomerInvoiceSummary = (customerId: string | undefined) => useQuery({
  queryKey: [...queryKeys.invoices, 'customer-summary', customerId],
  queryFn: () => getCustomerSummary(customerId as string),
  enabled: Boolean(customerId),
  retry: retryUnlessDenied,
})

/** Totals for a page of customers in one request (the Customers list). */
export const useCustomerInvoiceSummaries = (customerIds: string[]) => {
  const { scope, ready } = useBusinessScope()
  const ids = [...new Set(customerIds.filter(Boolean))].sort()
  return useQuery({
    queryKey: [...queryKeys.invoices, 'customer-summaries', scope, ids],
    queryFn: () => getCustomerSummaries(ids),
    enabled: ready && ids.length > 0,
    staleTime: 60_000,
    retry: retryUnlessDenied,
  })
}

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
