import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { generatePath, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useCustomerSearch } from '@/api/customers'
import {
  invoiceErrorMessage, isEditable, isInvoiceForbidden, useDeleteInvoiceItem, useInvoice, useInvoiceItems, useNextInvoiceNumber, useSaveInvoice,
  type Invoice, type InvoiceDesign, type InvoiceItem,
} from '@/api/invoices'
import { useImageUpload } from '@/hooks/useImageUpload'
import { paths } from '@/routes/paths'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { DEFAULT_ACCOUNT, DEFAULT_TAX_RATE, designAccent, TAX_RATES, type OptionalColumn, type TaxRate } from '../constants'
import { isoDaysFromNow } from '../dates'
import type { InvoiceDocumentModel } from '../document'
import { invoiceSchema, isBlankLine, type InvoiceFormValues, type InvoiceLine } from '../schemas'
import { invoiceTotals, lineAmounts } from '../totals'
import { useCurrentUserName } from './useCurrentUserName'
import { useInvoicePdf } from './useInvoicePdf'
import { useNewContactForm, useNewItemForm } from './useInvoiceQuickCreate'

/** Prefill handed over from another screen, e.g. "Create invoice" on an expense. */
export type InvoiceDraft = { client: string; amount: number; note: string }
type IncomingState = { draft?: InvoiceDraft; template?: InvoiceDesign } | null

/** Handed to the detail page after saving, so it can offer the PDF straight away. */
export type InvoiceCreatedState = { created: true }

type SaveStatus = 'Draft' | 'Approved' | 'Sent'

const DEFAULT_LEGAL_NAME = 'Your business'
const MAX_FILES = 10

type PickedContact = { id: string; name: string; email: string; phone: string }

const blankLine = (): InvoiceLine => ({ itemId: '', description: '', qty: '', price: '', discount: '', account: DEFAULT_ACCOUNT, taxRate: DEFAULT_TAX_RATE })

const taxRateOf = (rate: number): TaxRate => TAX_RATES.find(option => Number(option.value) === rate)?.value ?? DEFAULT_TAX_RATE

/** A saved draft as form values. */
const valuesFromInvoice = (invoice: Invoice): InvoiceFormValues => ({
  contactId: invoice.clientId,
  issueDate: invoice.issued,
  dueDate: invoice.due,
  note: invoice.note,
  currency: 'NGN',
  taxMode: invoice.taxMode,
  lines: invoice.lines.length
    ? invoice.lines.map(row => ({ itemId: row.itemId, description: row.description, qty: String(row.qty || ''), price: String(row.price), discount: row.discount ? String(row.discount) : '', account: row.account || DEFAULT_ACCOUNT, taxRate: taxRateOf(row.taxRate) }))
    : [blankLine()],
  design: invoice.design,
  accent: invoice.branding.accent,
  legalName: invoice.branding.legalName,
  address: invoice.branding.address,
})

/**
 * Everything the New invoice / Edit draft screen shows and does. The server assigns the number
 * (shown from next-number), works out the totals and snapshots the client and branding.
 */
export function useInvoiceForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { invoiceId } = useParams()
  const editing = Boolean(invoiceId)
  const incoming = location.state as IncomingState
  const [source] = useState(() => incoming?.draft ?? null)
  const [initialDesign] = useState<InvoiceDesign>(() => incoming?.template ?? 'Classic')
  const business = useBusinessDataStore(state => state.businessData)
  const userName = useCurrentUserName()

  const existing = useInvoice(invoiceId)
  const nextNumber = useNextInvoiceNumber(!editing)

  // Contacts are the business's customers (Customers API), searched as you type.
  const [contactQuery, setContactQuery] = useState('')
  const customers = useCustomerSearch(contactQuery)
  const [contact, setContact] = useState<PickedContact | null>(null)
  const items = useInvoiceItems()
  const deleteItem = useDeleteInvoiceItem()
  const saveInvoice = useSaveInvoice()

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contactId: '',
      issueDate: isoDaysFromNow(0),
      dueDate: '',
      note: '',
      currency: 'NGN',
      taxMode: 'exclusive',
      lines: [source ? { ...blankLine(), description: source.note, qty: '1', price: String(source.amount) } : blankLine()],
      design: initialDesign,
      accent: designAccent(initialDesign),
      legalName: business?.name || DEFAULT_LEGAL_NAME,
      address: business?.address || '',
    },
  })

  // Editing: fill the form once the draft loads.
  const loaded = useRef(false)
  const draft = existing.data
  useEffect(() => {
    if (!draft || loaded.current || !isEditable(draft)) return
    loaded.current = true
    form.reset(valuesFromInvoice(draft))
    setContact({ id: draft.clientId, name: draft.client, email: draft.clientEmail, phone: draft.clientPhone })
  }, [draft, form])

  const lines = useFieldArray({ control: form.control, name: 'lines' })
  const values = useWatch({ control: form.control }) as InvoiceFormValues
  const watchedLines = useMemo(() => values.lines ?? [], [values.lines])
  const taxMode = values.taxMode ?? 'exclusive'

  const totals = useMemo(() => invoiceTotals(watchedLines, taxMode), [watchedLines, taxMode])
  const lineFigures = useMemo(() => watchedLines.map(line => lineAmounts(line, taxMode)), [watchedLines, taxMode])

  const itemList = useMemo(() => items.data ?? [], [items.data])
  const pickContact = (picked: PickedContact) => {
    setContact(picked)
    form.setValue('contactId', picked.id, { shouldDirty: true, shouldValidate: true })
  }

  /** Picking a design brings its colour along, unless the user chose their own brand colour. */
  const chooseDesign = (design: InvoiceDesign) => {
    const ownColour = form.getValues('accent') !== designAccent(form.getValues('design'))
    form.setValue('design', design, { shouldDirty: true })
    if (!ownColour) form.setValue('accent', designAccent(design), { shouldDirty: true })
  }

  // Columns menu
  const [hidden, setHidden] = useState<OptionalColumn[]>([])
  const toggleColumn = (column: OptionalColumn) => setHidden(current => current.includes(column) ? current.filter(item => item !== column) : [...current, column])

  // Files: kept in the browser only, there's nowhere to upload them yet.
  const [files, setFiles] = useState<File[]>([])
  const addFiles = (list: FileList | null) => {
    const next = [...files, ...Array.from(list ?? [])]
    if (next.length > MAX_FILES) toast.info(`You can attach up to ${MAX_FILES} files.`)
    setFiles(next.slice(0, MAX_FILES))
  }

  // Drag to reorder rows; arrow keys on the handle do the same for keyboards.
  const dragFrom = useRef<number | null>(null)
  const moveRow = (from: number, to: number) => { if (to >= 0 && to < lines.fields.length && from !== to) lines.move(from, to) }

  const applyItem = (item: InvoiceItem, row: number) => {
    const current = form.getValues(`lines.${row}`)
    form.setValue(`lines.${row}`, { ...current, itemId: item.id, description: item.description || item.name, price: String(item.price), qty: current.qty || '1' }, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
  }

  const contactForm = useNewContactForm(created => pickContact({ id: created.id, name: created.name, email: created.email, phone: created.phone }))
  const itemForm = useNewItemForm(applyItem)

  // Preview: the printable invoice in the chosen design. A picked logo is uploaded with the draft (POST invoices/{id}/logo/).
  const [previewing, setPreviewing] = useState(false)
  const [logo, setLogo] = useState<{ file: File; dataUrl: string } | null>(null)
  const pendingLogo = useRef<File | null>(null)
  const pickLogo = useImageUpload(dataUrl => { if (pendingLogo.current) setLogo({ file: pendingLogo.current, dataUrl }) })
  const savedLogo = draft?.branding.logoUrl || ''
  const logoUrl = logo?.dataUrl || savedLogo || business?.logo || ''

  const number = editing ? draft?.number ?? '' : nextNumber.data ?? ''
  const lineDescription = (line: InvoiceLine) => line.description || itemList.find(item => item.id === line.itemId)?.name || 'Item'
  const doc: InvoiceDocumentModel = {
    design: values.design,
    accent: values.accent,
    legalName: values.legalName,
    address: values.address,
    logoUrl,
    party: contact?.name || 'Your customer',
    partyEmail: contact?.email || '',
    partyPhone: contact?.phone || '',
    number: number || 'INV-',
    reference: draft?.reference ?? '',
    issueDate: values.issueDate,
    dueDate: values.dueDate || values.issueDate,
    lines: watchedLines.filter(line => !isBlankLine(line)).map(line => ({ description: lineDescription(line), qty: Number(line.qty) || 0, price: Number(line.price) || 0, amount: lineAmounts(line, taxMode).amount })),
    ...totals,
    amountPaid: 0,
    balance: totals.total,
    status: 'Draft',
  }
  const pdf = useInvoicePdf(previewing ? doc : null)

  const save = (status: SaveStatus) => form.handleSubmit(async submitted => {
    const filled = submitted.lines.filter(line => !isBlankLine(line))
    const client = contact?.id === submitted.contactId ? contact : null
    let result
    try {
      result = await saveInvoice.mutateAsync({
        id: invoiceId,
        status,
        by: userName,
        logo,
        client: { name: client?.name ?? '', email: client?.email ?? '', phone: client?.phone ?? '' },
        input: {
          customerId: submitted.contactId,
          issueDate: submitted.issueDate,
          dueDate: submitted.dueDate,
          taxMode: submitted.taxMode,
          design: submitted.design,
          accent: submitted.accent,
          legalName: submitted.legalName.trim() || DEFAULT_LEGAL_NAME,
          address: submitted.address.trim(),
          note: submitted.note.trim(),
          lines: filled.map(line => ({
            description: lineDescription(line), qty: Number(line.qty) || 0, price: Number(line.price) || 0, discount: Number(line.discount) || 0,
            taxRate: submitted.taxMode === 'none' ? 0 : Number(line.taxRate) || 0, account: line.account, itemId: line.itemId,
          })),
        },
      })
    } catch (error) {
      toast.error(invoiceErrorMessage(error, "Couldn't save the invoice."))
      return
    }
    const { invoice, warning } = result
    if (warning) toast.warning(`${invoice.number} was saved as ${invoice.status.toLowerCase()}, but: ${warning}`, { duration: 8000 })
    else toast.success(status === 'Draft' ? `${invoice.number} saved as a draft.` : status === 'Approved' ? `${invoice.number} approved.` : `${invoice.number} sent. Share its link or PDF with ${invoice.client || 'your customer'}.`)
    navigate(generatePath(paths.invoiceDetail, { invoiceId: invoice.id }), { state: editing ? null : { created: true } satisfies InvoiceCreatedState })
  }, () => toast.error('Check the highlighted fields.'))

  const [saving, setSaving] = useState<SaveStatus | null>(null)
  const run = (status: SaveStatus) => async () => {
    setSaving(status)
    try { await save(status)() } finally { setSaving(null) }
  }

  return {
    form,
    lines,
    values,
    editing,
    /** Editing: still loading the draft, or it can't be edited (not a draft, no access, gone). */
    loadingDraft: editing && existing.isLoading,
    blocked: editing && !existing.isLoading
      ? existing.error
        ? { forbidden: isInvoiceForbidden(existing.error), message: invoiceErrorMessage(existing.error, "We couldn't load this invoice.") }
        : draft && !isEditable(draft) ? { forbidden: false, message: `${draft.number} is ${draft.status.toLowerCase()}, so it can't be edited any more. Only drafts can be changed.` } : null
      : null,
    number: { value: number, loading: !editing && nextNumber.isLoading },
    design: { value: values.design, choose: chooseDesign },
    contacts: {
      options: customers.customers.map(item => ({ value: item.id, label: item.name, hint: [item.phone, item.email].filter(Boolean).join(' · ') })),
      loading: customers.isLoading || customers.isFetching,
      selected: contact,
      setQuery: setContactQuery,
      pick: (id: string) => {
        const found = customers.customers.find(item => item.id === id)
        if (found) pickContact({ id: found.id, name: found.name, email: found.email, phone: found.phone })
      },
    },
    items: {
      list: itemList,
      loading: items.isLoading,
      /** Deletes a saved item (lines already using it keep their text and price). */
      remove: (id: string) => {
        const item = itemList.find(entry => entry.id === id)
        deleteItem.mutate(id, {
          onSuccess: () => toast.success(`${item?.name ?? 'Item'} removed from saved items.`),
          onError: error => toast.error(invoiceErrorMessage(error, "Couldn't delete the item.")),
        })
      },
    },
    contactForm,
    itemForm,
    applyItem,
    clearItem: (row: number) => form.setValue(`lines.${row}.itemId`, '', { shouldDirty: true }),
    lineFigures,
    totals,
    columns: { hidden, isVisible: (column: OptionalColumn) => !hidden.includes(column), toggle: toggleColumn },
    rows: {
      add: (count = 1) => lines.append(Array.from({ length: count }, blankLine)),
      remove: (index: number) => (lines.fields.length > 1 ? lines.remove(index) : form.setValue('lines.0', blankLine())),
      move: moveRow,
      dragStart: (index: number) => { dragFrom.current = index },
      dragOver: (index: number) => {
        const from = dragFrom.current
        if (from === null || from === index) return
        moveRow(from, index)
        dragFrom.current = index
      },
      dragEnd: () => { dragFrom.current = null },
    },
    files: { list: files, add: addFiles, remove: (index: number) => setFiles(current => current.filter((_, position) => position !== index)) },
    preview: {
      open: previewing,
      doc,
      pdf,
      logoName: logo ? logo.file.name : savedLogo ? 'Invoice logo' : business?.logo ? 'Business logo' : 'No logo yet (initial shown)',
      logoUrl,
      onLogo: (file: File) => { pendingLogo.current = file; void pickLogo(file) },
      show: () => setPreviewing(true),
      close: () => setPreviewing(false),
    },
    saving,
    saveDraft: run('Draft'),
    approve: run('Approved'),
    send: run('Sent'),
    back: () => (editing && invoiceId ? navigate(generatePath(paths.invoiceDetail, { invoiceId })) : navigate(paths.invoices)),
    onlinePaymentsPath: paths.accounts,
  }
}

export type InvoiceFormModel = ReturnType<typeof useInvoiceForm>
