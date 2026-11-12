import { useState } from 'react'
import { toast } from 'sonner'
import { invoiceErrorMessage, useReverseInvoicePayment, useSetInvoiceStatus, type Invoice, type InvoicePayment } from '@/api/invoices'
import { useClipboard } from '@/hooks/useClipboard'

/** Approve, Mark as sent, payment reversal and the public link on the invoice detail page. */
export function useInvoiceActions(invoice: Invoice | undefined, userName: string) {
  const setStatus = useSetInvoiceStatus()
  const reverse = useReverseInvoicePayment()
  const clipboard = useClipboard()
  const [moving, setMoving] = useState<'Approved' | 'Sent' | null>(null)
  const [toReverse, setToReverse] = useState<InvoicePayment | null>(null)

  const move = (status: 'Approved' | 'Sent') => async () => {
    if (!invoice) return
    setMoving(status)
    try {
      const next = await setStatus.mutateAsync({ id: invoice.id, status, by: userName })
      toast.success(status === 'Approved' ? `${next.number} approved. Mark it as sent when it goes to ${next.client || 'the customer'}.` : `${next.number} marked as sent. Its public link is ready to share.`)
    } catch (error) {
      toast.error(invoiceErrorMessage(error, status === 'Approved' ? "Couldn't approve the invoice." : "Couldn't mark the invoice as sent."))
    } finally {
      setMoving(null)
    }
  }

  const link = invoice?.publicUrl ?? ''
  const shareText = invoice ? `Invoice ${invoice.number} from ${invoice.branding.legalName || 'us'}` : ''

  return {
    moving,
    approve: move('Approved'),
    markSent: move('Sent'),
    reversal: {
      payment: toReverse,
      busy: reverse.isPending,
      ask: setToReverse,
      cancel: () => setToReverse(null),
      confirm: async () => {
        if (!invoice || !toReverse) return
        try {
          await reverse.mutateAsync({ invoiceId: invoice.id, paymentId: toReverse.id, by: userName })
          toast.success('Payment reversed. It stays in the history and no longer counts toward the amount paid.')
          setToReverse(null)
        } catch (error) {
          toast.error(invoiceErrorMessage(error, "Couldn't reverse the payment."))
        }
      },
    },
    publicLink: {
      url: link,
      copied: clipboard.copied,
      canShare: typeof navigator !== 'undefined' && typeof navigator.share === 'function',
      copy: () => void clipboard.copy(link),
      share: async () => {
        try {
          await navigator.share({ title: shareText, text: `${shareText}. View and pay here:`, url: link })
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) void clipboard.copy(link)
        }
      },
      open: () => window.open(link, '_blank', 'noopener,noreferrer'),
    },
  }
}

export type InvoiceActions = ReturnType<typeof useInvoiceActions>
