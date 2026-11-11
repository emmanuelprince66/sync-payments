import { useState } from 'react'
import { toast } from 'sonner'
import { invoiceBalance, invoicePaymentState, useLogInvoiceReminder, type Invoice, type InvoiceReminderChannel } from '@/api/invoices'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { longDate } from '../dates'
import { mailtoUrl, reminderMessage, whatsappUrl } from '../reminder'
import type { InvoicePdfModel } from './useInvoicePdf'

/**
 * "Send reminder". There's no messaging endpoint, so the message opens prefilled in the
 * user's WhatsApp or email (or the device share sheet, with the PDF attached), the PDF
 * downloads for attaching, and "Reminder sent" is logged on the invoice.
 */
export function useInvoiceReminder(invoice: Invoice | undefined, pdf: InvoicePdfModel, userName: string) {
  const money = useFormatMoney()
  const log = useLogInvoiceReminder()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const start = () => {
    if (!invoice) return
    const state = invoicePaymentState(invoice)
    setPhone(invoice.clientPhone)
    setEmail(invoice.clientEmail)
    setMessage(reminderMessage({
      client: invoice.client || 'there', number: invoice.id, amountDue: money(invoiceBalance(invoice)), dueDate: longDate(invoice.due),
      overdue: state === 'Overdue', partPaid: invoice.amountPaid > 0, business: invoice.branding.legalName,
    }))
    setOpen(true)
    pdf.prepare()
  }

  const logged = async (channel: InvoiceReminderChannel) => {
    if (!invoice) return
    try {
      await log.mutateAsync({ invoiceId: invoice.id, channel, by: userName })
    } catch {
      toast.error("The reminder went out but couldn't be logged.")
    }
  }

  const subject = invoice ? `Payment reminder: invoice ${invoice.id}` : 'Payment reminder'

  return {
    open,
    phone, setPhone,
    email, setEmail,
    message, setMessage,
    shareSupported: pdf.shareSupported,
    busy: pdf.busy !== null || log.isPending,
    start,
    close: () => setOpen(false),
    /** Opens WhatsApp first (still inside the click, so it isn't blocked), then downloads the PDF to attach. */
    viaWhatsApp: async () => {
      window.open(whatsappUrl(phone, message), '_blank', 'noopener,noreferrer')
      const file = await pdf.download()
      await logged('WhatsApp')
      toast.success(file ? `WhatsApp opened. Attach ${file.name} from your downloads.` : 'WhatsApp opened with your reminder.')
      setOpen(false)
    },
    viaEmail: async () => {
      if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) return toast.error('Enter a valid email address.')
      const link = document.createElement('a')
      link.href = mailtoUrl(email, subject, message)
      link.click()
      const file = await pdf.download()
      await logged('Email')
      toast.success(file ? `Your email app opened. Attach ${file.name} from your downloads.` : 'Your email app opened with the reminder.')
      setOpen(false)
    },
    /** Device share sheet with the PDF attached (phones), e.g. straight into a WhatsApp chat. */
    viaShare: async () => {
      if (await pdf.share(message)) {
        await logged('Share')
        toast.success('Reminder shared.')
        setOpen(false)
      }
    },
  }
}

export type InvoiceReminder = ReturnType<typeof useInvoiceReminder>
