import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { createInvoice, createInvoiceItem, getInvoiceItems, getInvoices, getInvoiceSummary } from './sample/invoices'

export { peekNextInvoiceNumber } from './sample/invoices'
export type { Invoice, InvoiceItem, InvoiceStatus, InvoiceSummary } from './sample/invoices'

export const useInvoices = () => useQuery({ queryKey: [...queryKeys.invoices, 'list'], queryFn: getInvoices })
export const useInvoiceSummary = () => useQuery({ queryKey: [...queryKeys.invoices, 'summary'], queryFn: getInvoiceSummary })

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
  })
}

/** Saved items for invoice lines (sample data: no items endpoint yet). */
export const useInvoiceItems = () => useQuery({ queryKey: [...queryKeys.invoices, 'items'], queryFn: getInvoiceItems })

export const useCreateInvoiceItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInvoiceItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...queryKeys.invoices, 'items'] }),
  })
}
