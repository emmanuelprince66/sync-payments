import { useState } from 'react'
import { toast } from 'sonner'
import { invoiceBalance, invoiceErrorMessage, invoicePaymentState, useSendInvoiceReminder, type Invoice, type InvoiceReminderChannel } from '@/api/invoices'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { longDate } from '../dates'
import { mailtoUrl, reminderMessage, whatsappUrl } from '../reminder'
import type { InvoicePdfModel } from './useInvoicePdf'

/** Shown in the modal when a channel didn't actually deliver. */
export type ReminderNotice = { text: string; emailFallback: boolean }

/**
 * "Send reminder" (POST invoices/{id}/reminders/, which always logs the activity):
 *  - Email is sent by Sync360 to the customer's email on file, with the invoice's public link.
 *  - WhatsApp isn't sent by the server yet, so the message opens prefilled in the user's WhatsApp (wa.me) and is logged.
 *  - Share opens the device share sheet with the PDF and link, and is logged.
 */
export function useInvoiceReminder(invoice: Invoice | undefined, pdf: InvoicePdfModel, userName: string) {
  const money = useFormatMoney()
  const send = useSendInvoiceReminder()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState<ReminderNotice | null>(null)
  const [pending, setPending] = useState<InvoiceReminderChannel | null>(null)

  const start = () => {
    if (!invoice) return
    setPhone(invoice.clientPhone)
    setNotice(null)
    setMessage(reminderMessage({
      client: invoice.client || 'there', number: invoice.number, amountDue: money(invoiceBalance(invoice)), dueDate: longDate(invoice.due),
      overdue: invoicePaymentState(invoice) === 'Overdue', partPaid: invoice.amountPaid > 0, business: invoice.branding.legalName, publicUrl: invoice.publicUrl,
    }))
    setOpen(true)
    pdf.prepare()
  }

  const log = async (channel: InvoiceReminderChannel) => {
    if (!invoice) return null
    setPending(channel)
    try {
      return await send.mutateAsync({ invoiceId: invoice.id, channel, by: userName })
    } catch (error) {
      setNotice({ text: invoiceErrorMessage(error, "The reminder couldn't be logged."), emailFallback: false })
      return null
    } finally {
      setPending(null)
    }
  }

  const subject = invoice ? `Payment reminder: invoice ${invoice.number}` : 'Payment reminder'

  return {
    open,
    phone, setPhone,
    email: invoice?.clientEmail ?? '',
    message, setMessage,
    notice,
    hasLink: Boolean(invoice?.publicUrl),
    shareSupported: pdf.shareSupported,
    pending,
    busy: pdf.busy !== null || send.isPending,
    start,
    close: () => setOpen(false),
    /** Opens WhatsApp inside the click (so it isn't blocked), then logs it. The server doesn't send WhatsApp messages yet. */
    viaWhatsApp: async () => {
      window.open(whatsappUrl(phone, message), '_blank', 'noopener,noreferrer')
      const result = await log('whatsapp')
      if (!result) return
      if (result.sendSucceeded) toast.success('Reminder sent on WhatsApp.')
      else toast.info("WhatsApp opened with your message. Press send in WhatsApp: Sync360 can't send WhatsApp messages for you yet.", { duration: 7000 })
      setOpen(false)
    },
    /** Sent by Sync360 with the public link. If it didn't go out, say so and offer the user's own email app. */
    viaEmail: async () => {
      setNotice(null)
      const result = await log('email')
      if (!result) return
      if (result.sendSucceeded) {
        toast.success(`Reminder emailed to ${invoice?.clientEmail || 'the customer'}.`)
        setOpen(false)
        return
      }
      setNotice({ text: `Sync360 couldn't send the email${result.message ? `: ${result.message}` : ''}. The reminder was logged; you can send it from your own email app instead.`, emailFallback: true })
    },
    openEmailApp: () => {
      const link = document.createElement('a')
      link.href = mailtoUrl(invoice?.clientEmail ?? '', subject, message)
      link.click()
    },
    /** Device share sheet with the PDF attached (phones), e.g. straight into a WhatsApp chat. */
    viaShare: async () => {
      if (await pdf.share(message)) {
        if (await log('share')) {
          toast.success('Reminder shared.')
          setOpen(false)
        }
      }
    },
  }
}

export type InvoiceReminder = ReturnType<typeof useInvoiceReminder>
