import { useCallback, useMemo } from 'react'
import { invoiceBalance, invoicePaymentState, useInvoices, type Invoice, type InvoicePaymentState } from '@/api/invoices'

/**
 * Invoice figures per customer. Invoices have no endpoint yet and come from the sample store
 * (`useInvoices`). An invoice belongs to a customer by `clientId`; invoices with no client id
 * fall back to matching the client's name (case-insensitive).
 */

export type CustomerInvoice = Invoice & { state: InvoicePaymentState; balance: number }

export type CustomerInvoiceFigures = {
  invoices: CustomerInvoice[]
  /** Collected so far across this customer's invoices. */
  paid: number
  paidCount: number
  /** Still owed on pending, part-paid and overdue invoices. */
  unpaid: number
  unpaidCount: number
  overdue: number
  overdueCount: number
  /** Has a pending, part-paid or overdue invoice. */
  atRisk: boolean
}

const OPEN_STATES: InvoicePaymentState[] = ['Pending', 'Part paid', 'Overdue']

const nameKey = (value: string) => value.trim().toLowerCase()

export const figuresFor = (invoices: CustomerInvoice[]): CustomerInvoiceFigures => {
  const open = invoices.filter(invoice => OPEN_STATES.includes(invoice.state))
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

export function useCustomerInvoices() {
  const query = useInvoices()

  const index = useMemo(() => {
    const byId = new Map<string, CustomerInvoice[]>()
    const byName = new Map<string, CustomerInvoice[]>()
    const all: CustomerInvoice[] = []
    for (const invoice of query.data ?? []) {
      const row: CustomerInvoice = { ...invoice, state: invoicePaymentState(invoice), balance: invoiceBalance(invoice) }
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
    totals: useMemo(() => figuresFor(index.all), [index]),
    forCustomer,
  }
}
