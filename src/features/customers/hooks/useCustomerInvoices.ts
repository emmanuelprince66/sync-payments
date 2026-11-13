import { useCallback, useMemo } from 'react'
import {
  invoiceBalance, invoicePaymentState, OPEN_PAYMENT_STATES, useCustomerInvoiceSummaries, useCustomerInvoiceSummary, useInvoiceAnalytics, useInvoices,
  type CustomerInvoiceSummary, type Invoice, type InvoicePaymentState,
} from '@/api/invoices'

/**
 * Invoice figures for customers.
 *  - Customers list: one bulk request for the visible page's customers
 *    (GET invoices/business/{id}/customer-summaries/?customer_ids=a,b), and the business-wide
 *    totals from the invoice analytics endpoint.
 *  - Customer detail: the server's per-customer summary for the totals, and the invoice list
 *    filtered by `customer` for the table.
 */

export type CustomerInvoice = Invoice & { state: InvoicePaymentState; balance: number }

const withState = (invoice: Invoice): CustomerInvoice => ({ ...invoice, state: invoicePaymentState(invoice), balance: invoiceBalance(invoice) })

const EMPTY: CustomerInvoiceSummary = { totalPaid: 0, totalUnpaid: 0, overdue: 0, invoiceCount: 0 }

/** Customers list: figures per visible row, plus business-wide totals. */
export function useCustomerInvoices(customerIds: string[]) {
  const summaries = useCustomerInvoiceSummaries(customerIds)
  const analytics = useInvoiceAnalytics()

  const forCustomer = useCallback((customerId: string): CustomerInvoiceSummary => summaries.data?.[customerId] ?? EMPTY, [summaries.data])

  return {
    /** Row figures still loading for this page. */
    rowsLoading: summaries.isLoading,
    /** No invoice access (403) or the request failed: figures are left out rather than shown as zero. */
    unavailable: summaries.isError,
    forCustomer,
    totals: {
      isLoading: analytics.isLoading,
      unavailable: analytics.isError,
      expectedCash: analytics.data?.expectedCash ?? 0,
      openCount: analytics.data?.outstandingCount ?? 0,
      overdueCount: analytics.data?.overdueCount ?? 0,
      paidThisMonth: analytics.data?.paidThisMonth ?? 0,
      paidChange: analytics.data?.paidChange ?? '—',
    },
  }
}

const DETAIL_LIMIT = 50

/** Customer detail: the server summary for the totals, and this customer's invoices for the table and counts. */
export function useCustomerInvoiceDetail(customerId: string | undefined) {
  const summary = useCustomerInvoiceSummary(customerId)
  const list = useInvoices({ customer: customerId ?? '', limit: DETAIL_LIMIT, enabled: Boolean(customerId) })
  const rows = useMemo(() => (list.data?.invoices ?? []).map(withState).sort((a, b) => b.issued.localeCompare(a.issued)), [list.data])
  const counts = useMemo(() => {
    const open = rows.filter(invoice => OPEN_PAYMENT_STATES.includes(invoice.state))
    return {
      paidCount: rows.filter(invoice => invoice.state === 'Paid').length,
      unpaidCount: open.length,
      overdueCount: open.filter(invoice => invoice.state === 'Overdue').length,
      paid: rows.reduce((sum, invoice) => sum + invoice.amountPaid, 0),
      unpaid: open.reduce((sum, invoice) => sum + invoice.balance, 0),
      overdue: open.filter(invoice => invoice.state === 'Overdue').reduce((sum, invoice) => sum + invoice.balance, 0),
    }
  }, [rows])
  const server = summary.data

  return {
    isLoading: summary.isLoading || list.isLoading,
    unavailable: summary.isError && list.isError,
    rows,
    /** Server totals where available; counts come from the invoice list. */
    figures: {
      ...counts,
      paid: server?.totalPaid ?? counts.paid,
      unpaid: server?.totalUnpaid ?? counts.unpaid,
      overdue: server?.overdue ?? counts.overdue,
      atRisk: (server?.totalUnpaid ?? counts.unpaid) > 0,
      count: server?.invoiceCount ?? list.data?.total ?? rows.length,
    },
  }
}
