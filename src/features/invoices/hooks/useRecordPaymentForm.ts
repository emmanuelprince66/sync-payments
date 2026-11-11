import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { invoiceBalance, useRecordInvoicePayment, type Invoice } from '@/api/invoices'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { isoDaysFromNow } from '../dates'
import { parseAmount, paymentSchema, type PaymentFormValues } from '../schemas'

const blank = (amount: number): PaymentFormValues => ({ amount: amount ? String(amount) : '', date: isoDaysFromNow(0), method: 'Bank transfer', note: '' })

/** "Record payment": a full or part payment against the balance due. */
export function useRecordPaymentForm(invoice: Invoice | undefined, userName: string) {
  const money = useFormatMoney()
  const [open, setOpen] = useState(false)
  const record = useRecordInvoicePayment()
  const balance = invoice ? invoiceBalance(invoice) : 0
  const form = useForm<PaymentFormValues>({ resolver: zodResolver(paymentSchema), defaultValues: blank(0) })
  const entered = parseAmount(useWatch({ control: form.control, name: 'amount' }) ?? '')
  const remaining = Math.max(Math.round((balance - entered) * 100) / 100, 0)

  return {
    open,
    form,
    balance,
    remaining,
    isFull: entered > 0 && remaining <= 0,
    submitting: record.isPending,
    start: () => { form.reset(blank(balance)); setOpen(true) },
    close: () => setOpen(false),
    payInFull: () => form.setValue('amount', String(balance), { shouldValidate: true }),
    submit: form.handleSubmit(async values => {
      if (!invoice) return
      const amount = parseAmount(values.amount)
      if (amount > balance + 0.001) return form.setError('amount', { message: `No more than the balance due (${money(balance)})` })
      try {
        await record.mutateAsync({ invoiceId: invoice.id, amount, date: values.date, method: values.method, note: values.note.trim(), recordedBy: userName })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't record the payment.")
        return
      }
      const left = Math.max(Math.round((balance - amount) * 100) / 100, 0)
      toast.success(left <= 0 ? `${invoice.id} is now paid in full.` : `Part payment of ${money(amount)} recorded. ${money(left)} is still due.`)
      setOpen(false)
    }),
  }
}

export type RecordPaymentForm = ReturnType<typeof useRecordPaymentForm>
