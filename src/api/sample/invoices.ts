import { mockDelay } from '@/lib/api-client'

/**
 * Sample data: the backend has no invoice endpoints yet. Swapping in real ones
 * means replacing these functions; hooks and screens stay as they are.
 */

export type InvoiceStatus = 'Draft' | 'Approved' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue'

/** A saved product or service, reusable across invoice lines. */
export type InvoiceItem = { id: string; code: string; name: string; description: string; price: number }

export type Invoice = {
  id: string
  client: string
  amount: number
  /** ISO dates. */
  issued: string
  due: string
  status: InvoiceStatus
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

let invoices: Invoice[] = [
  { id: 'INV-1048', client: 'Northstar Coffee', amount: 12840, issued: '2026-06-20', due: '2026-07-04', status: 'Sent' },
  { id: 'INV-1047', client: 'Fieldwork Studio', amount: 7800, issued: '2026-06-18', due: '2026-07-02', status: 'Viewed' },
  { id: 'INV-1046', client: 'Olive & Reed', amount: 4290, issued: '2026-06-12', due: '2026-06-26', status: 'Paid' },
  { id: 'INV-1045', client: 'Juniper Market', amount: 6220, issued: '2026-06-08', due: '2026-06-22', status: 'Overdue' },
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

/** Next number in INV-0001 style. */
export const peekNextInvoiceNumber = () => `INV-${String(Math.max(0, ...invoices.map(invoice => numberOf(invoice.id))) + 1).padStart(4, '0')}`

export const getInvoices = () => mockDelay([...invoices])
export const getInvoiceSummary = () => mockDelay(summary)

/** Drafts and approved invoices keep their status; everything else goes out as Sent. */
export const createInvoice = ({ status = 'Sent', ...input }: Omit<Invoice, 'status'> & { status?: InvoiceStatus }) => {
  const invoice: Invoice = { ...input, status }
  invoices = [invoice, ...invoices]
  return mockDelay(invoice)
}

export const getInvoiceItems = () => mockDelay([...items], 250)
export const createInvoiceItem = (input: Omit<InvoiceItem, 'id'>) => {
  const item: InvoiceItem = { ...input, id: `i-${Date.now()}` }
  items = [item, ...items]
  return mockDelay(item, 250)
}
