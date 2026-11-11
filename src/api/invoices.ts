import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { createInvoice, createInvoiceItem, getInvoice, getInvoiceItems, getInvoices, getInvoiceSummary, logInvoiceReminder, recordInvoicePayment, type Invoice } from './sample/invoices'

export { INVOICE_DESIGNS, INVOICE_PAYMENT_METHODS, invoiceBalance, invoicePaymentState, peekNextInvoiceNumber } from './sample/invoices'
export type {
  CreateInvoiceInput, Invoice, InvoiceActivity, InvoiceActivityType, InvoiceBranding, InvoiceDesign, InvoiceItem, InvoiceLineRecord, InvoicePayment,
  InvoicePaymentMethod, InvoicePaymentState, InvoiceReminderChannel, InvoiceStatus, InvoiceSummary, InvoiceTaxMode, RecordInvoicePaymentInput,
} from './sample/invoices'

const listKey = [...queryKeys.invoices, 'list'] as const
const detailKey = (id: string) => [...queryKeys.invoices, 'detail', id] as const

/** Every invoice (sample data: no invoices endpoint yet). */
export const useInvoices = () => useQuery({ queryKey: listKey, queryFn: getInvoices })
export const useInvoiceSummary = () => useQuery({ queryKey: [...queryKeys.invoices, 'summary'], queryFn: getInvoiceSummary })

/** One invoice with its lines, payments and activity. */
export const useInvoice = (id: string | undefined) => useQuery({ queryKey: detailKey(id ?? ''), queryFn: () => getInvoice(id ?? ''), enabled: Boolean(id), retry: false })

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: invoice => {
      queryClient.setQueryData(detailKey(invoice.id), invoice)
      return queryClient.invalidateQueries({ queryKey: queryKeys.invoices })
    },
  })
}

/** Writes the updated invoice into its detail cache and refreshes the lists. */
const useInvoiceUpdate = <Input,>(mutationFn: (input: Input) => Promise<Invoice>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: invoice => {
      queryClient.setQueryData(detailKey(invoice.id), invoice)
      return queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}

/** Records a full or part payment; a paid-off invoice becomes Paid. */
export const useRecordInvoicePayment = () => useInvoiceUpdate(recordInvoicePayment)

/** Logs "Reminder sent" on the invoice's activity (the message itself goes from the user's WhatsApp or email). */
export const useLogInvoiceReminder = () => useInvoiceUpdate(logInvoiceReminder)

/** Saved items for invoice lines (sample data: no items endpoint yet). */
export const useInvoiceItems = () => useQuery({ queryKey: [...queryKeys.invoices, 'items'], queryFn: getInvoiceItems })

export const useCreateInvoiceItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInvoiceItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...queryKeys.invoices, 'items'] }),
  })
}
