import { useCallback, useMemo } from 'react'
import {
  invoiceBalance, invoicePaymentState, OPEN_PAYMENT_STATES, useAllInvoices, useCustomerInvoiceSummary, useInvoices,
  type CustomerInvoiceSummary, type Invoice, type InvoicePaymentState,
} from '@/api/invoices'

/**
 * Invoice figures for customers.
 *  - Customers list: one walk of the business's invoice list (`useAllInvoices`, up to 1,000 rows in
 *    pages of 200), grouped by customer id here. That is one or a few requests for the whole page,
 *    instead of a summary request per customer row.
 *  - Customer detail: the server's per-customer summary for the totals, and the invoice list filtered
 *    by `customer` for the table.
 * Invoices without a customer id fall back to matching the client's name (case-insensitive).
 */

export type CustomerInvoice = Invoice & { state: InvoicePaymentState; balance: number }

export type CustomerInvoiceFigures = {
  invoices: CustomerInvoice[]
  /** Collected so far across this customer's invoices. */
  paid: number
  paidCount: number
  /** Still owed on approved, pending, part-paid and overdue invoices. */
  unpaid: number
  unpaidCount: number
  overdue: number
  overdueCount: number
  /** Has an invoice with money still owed. */
  atRisk: boolean
}

const nameKey = (value: string) => value.trim().toLowerCase()
const withState = (invoice: Invoice): CustomerInvoice => ({ ...invoice, state: invoicePaymentState(invoice), balance: invoiceBalance(invoice) })

export const figuresFor = (invoices: CustomerInvoice[]): CustomerInvoiceFigures => {
  const open = invoices.filter(invoice => OPEN_PAYMENT_STATES.includes(invoice.state))
  const overdue = open.filter(invoice => invoice.state === 'Overdue')
  return {
    invoices,
    paid: invoices.reduce((sum, invoice) => sum + (invoice.amountPaid ?? 0), 0),
    paidCount: invoices.filter(invoice => invoice.state === 'Paid').length,
    unpaid: open.reduce((sum, invoice) => sum + invoice.balance, 0),
    unpaidCount: open.length,
    overdue: overdue.reduce((sum, invoice) => sum + invoice.balance, 0),
    overdueCount: overdue.length,
    atRisk: open.length > 0,
  }
}

/** Customers list: figures per row and in total, from one invoice-list walk. */
export function useCustomerInvoices() {
  const query = useAllInvoices()

  const index = useMemo(() => {
    const byId = new Map<string, CustomerInvoice[]>()
    const byName = new Map<string, CustomerInvoice[]>()
    const all: CustomerInvoice[] = []
    for (const invoice of query.data?.invoices ?? []) {
      const row = withState(invoice)
      all.push(row)
      const map = invoice.clientId ? byId : byName
      const key = invoice.clientId || nameKey(invoice.client)
      map.set(key, [...(map.get(key) ?? []), row])
    }
    return { byId, byName, all }
  }, [query.data])

  const forCustomer = useCallback((customer: { id: string; name: string }) => {
    const rows = [...(index.byId.get(customer.id) ?? []), ...(index.byName.get(nameKey(customer.name)) ?? [])]
    return figuresFor(rows.sort((a, b) => b.issued.localeCompare(a.issued)))
  }, [index])

  return {
    isLoading: query.isLoading,
    /** No invoice access (403) or the list failed: figures are left out rather than shown as zero. */
    unavailable: query.isError,
    totals: useMemo(() => figuresFor(index.all), [index]),
    forCustomer,
  }
}

const DETAIL_LIMIT = 50

/** Customer detail: the server summary for the totals, and this customer's invoices for the table. */
export function useCustomerInvoiceDetail(customerId: string | undefined) {
  const summary = useCustomerInvoiceSummary(customerId)
  const list = useInvoices({ customer: customerId ?? '', limit: DETAIL_LIMIT, enabled: Boolean(customerId) })
  const rows = useMemo(() => (list.data?.invoices ?? []).map(withState).sort((a, b) => b.issued.localeCompare(a.issued)), [list.data])
  const figures = useMemo(() => figuresFor(rows), [rows])
  const server: CustomerInvoiceSummary | undefined = summary.data

  return {
    isLoading: summary.isLoading || list.isLoading,
    unavailable: summary.isError && list.isError,
    rows,
    /** Server totals where available; counts come from the invoice list. */
    figures: {
      ...figures,
      paid: server?.totalPaid ?? figures.paid,
      unpaid: server?.totalUnpaid ?? figures.unpaid,
      overdue: server?.overdue ?? figures.overdue,
      atRisk: (server?.totalUnpaid ?? figures.unpaid) > 0,
      count: server?.invoiceCount ?? list.data?.total ?? rows.length,
    },
  }
}
