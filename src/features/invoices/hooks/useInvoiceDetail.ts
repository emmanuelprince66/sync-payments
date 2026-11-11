import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { invoiceBalance, invoicePaymentState, useInvoice } from '@/api/invoices'
import { paths } from '@/routes/paths'
import { documentFromInvoice } from '../document'
import { useCurrentUserName } from './useCurrentUserName'
import type { InvoiceCreatedState } from './useInvoiceForm'
import { useInvoiceReminder } from './useInvoiceReminder'
import { useInvoicePdf } from './useInvoicePdf'
import { useRecordPaymentForm } from './useRecordPaymentForm'

/** Everything the invoice detail ("View more") page shows and does. */
export function useInvoiceDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { invoiceId = '' } = useParams()
  const query = useInvoice(invoiceId)
  const invoice = query.data
  const userName = useCurrentUserName()

  const doc = useMemo(() => (invoice ? documentFromInvoice(invoice) : null), [invoice])
  const pdf = useInvoicePdf(doc)
  const payment = useRecordPaymentForm(invoice, userName)
  const reminder = useInvoiceReminder(invoice, pdf, userName)

  // Fresh from Create: offer the PDF straight away.
  const [justCreated, setJustCreated] = useState(() => Boolean((location.state as InvoiceCreatedState | null)?.created))

  // Phones share the PDF from the tap itself, so have it built before they ask.
  const { shareSupported, prepare } = pdf
  useEffect(() => {
    if (!shareSupported || !doc) return
    const timer = window.setTimeout(prepare, 700)
    return () => window.clearTimeout(timer)
  }, [shareSupported, prepare, doc])

  const state = invoice ? invoicePaymentState(invoice) : 'Pending'
  const balance = invoice ? invoiceBalance(invoice) : 0

  return {
    invoiceId,
    invoice,
    doc,
    isLoading: query.isLoading,
    notFound: query.isError,
    state,
    balance,
    paidPercent: invoice && invoice.amount > 0 ? Math.min(100, Math.round((invoice.amountPaid / invoice.amount) * 100)) : 0,
    canRecordPayment: Boolean(invoice) && balance > 0,
    canRemind: Boolean(invoice) && balance > 0 && state !== 'Draft',
    justCreated,
    dismissCreated: () => setJustCreated(false),
    pdf,
    payment,
    reminder,
    back: () => navigate(paths.invoices),
  }
}

export type InvoiceDetailModel = ReturnType<typeof useInvoiceDetail>
