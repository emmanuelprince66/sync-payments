import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateCustomer, type Customer } from '@/api/customers'
import { invoiceErrorMessage, useCreateInvoiceItem, type InvoiceItem } from '@/api/invoices'
import { DEFAULT_ACCOUNT, DEFAULT_TAX_RATE, TAX_RATES, type TaxRate } from '../constants'

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Contact name is required'),
  phone: z.string().trim().min(7, 'Enter a phone number').regex(/^\+?[\d\s-]+$/, 'Use digits only'),
  email: z.string().trim().refine(value => !value || z.string().email().safeParse(value).success, 'Enter a valid email'),
})
export type NewContactValues = z.infer<typeof contactSchema>

/** Saved item: the description is its name on the picker and the invoice line. */
const itemSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(255, 'Keep it under 255 characters'),
  price: z.string().trim().refine(value => !value || (Number.isFinite(Number(value)) && Number(value) >= 0), 'Enter a valid price'),
  taxRate: z.enum(TAX_RATES.map(rate => rate.value) as [TaxRate, ...TaxRate[]]),
  account: z.string(),
})
export type NewItemValues = z.infer<typeof itemSchema>

/** "+ Create new contact": adds a customer (Customers API) and hands it back to the invoice. */
export function useNewContactForm(onCreated: (contact: Customer) => void) {
  const [open, setOpen] = useState(false)
  const create = useCreateCustomer()
  const form = useForm<NewContactValues>({ resolver: zodResolver(contactSchema), defaultValues: { name: '', phone: '', email: '' } })

  return {
    open,
    form,
    submitting: create.isPending,
    start: (name = '') => { form.reset({ name, phone: '', email: '' }); setOpen(true) },
    close: () => setOpen(false),
    submit: form.handleSubmit(async values => {
      const contact = await create.mutateAsync({ name: values.name, phone: values.phone, email: values.email || undefined })
      toast.success(`${contact.name} added to your customers.`)
      onCreated(contact)
      setOpen(false)
    }),
  }
}

/** "+ Create new item": saves a reusable item and fills the row that asked for it. */
export function useNewItemForm(onCreated: (item: InvoiceItem, row: number) => void) {
  const [row, setRow] = useState<number | null>(null)
  const create = useCreateInvoiceItem()
  const blank = (description = ''): NewItemValues => ({ description, price: '', taxRate: DEFAULT_TAX_RATE, account: DEFAULT_ACCOUNT })
  const form = useForm<NewItemValues>({ resolver: zodResolver(itemSchema), defaultValues: blank() })

  return {
    open: row !== null,
    form,
    submitting: create.isPending,
    start: (forRow: number, description = '') => { form.reset(blank(description)); setRow(forRow) },
    close: () => setRow(null),
    submit: form.handleSubmit(async values => {
      let item: InvoiceItem
      try {
        item = await create.mutateAsync({ description: values.description, price: Number(values.price) || 0, taxRate: Number(values.taxRate), account: values.account })
      } catch (error) {
        toast.error(invoiceErrorMessage(error, "Couldn't save the item."))
        return
      }
      toast.success(`${item.description} saved for reuse.`)
      if (row !== null) onCreated(item, row)
      setRow(null)
    }),
  }
}

export type NewContactForm = ReturnType<typeof useNewContactForm>
export type NewItemForm = ReturnType<typeof useNewItemForm>
