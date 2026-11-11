import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { generatePath, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useCustomerSearch } from '@/api/customers'
import { peekNextInvoiceNumber, useCreateInvoice, useInvoiceItems, type InvoiceDesign, type InvoiceItem, type InvoiceStatus } from '@/api/invoices'
import { useImageUpload } from '@/hooks/useImageUpload'
import { paths } from '@/routes/paths'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { DEFAULT_ACCOUNT, DEFAULT_TAX_RATE, designAccent, type OptionalColumn } from '../constants'
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

const DEFAULT_LEGAL_NAME = 'Your business'
const MAX_FILES = 10

type PickedContact = { id: string; name: string; email: string; phone: string }

const blankLine = (): InvoiceLine => ({ itemId: '', description: '', qty: '', price: '', discount: '', account: DEFAULT_ACCOUNT, taxRate: DEFAULT_TAX_RATE })

/** Everything the Create invoice screen shows and does. Invoices are sample data, so nothing reaches a server. */
export function useInvoiceForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const incoming = location.state as IncomingState
  const [source] = useState(() => incoming?.draft ?? null)
  const [initialDesign] = useState<InvoiceDesign>(() => incoming?.template ?? 'Classic')
  const business = useBusinessDataStore(state => state.businessData)
  const userName = useCurrentUserName()

  // Contacts are the business's customers (Customers API), searched as you type.
  const [contactQuery, setContactQuery] = useState('')
  const customers = useCustomerSearch(contactQuery)
  const [contact, setContact] = useState<PickedContact | null>(null)
  const items = useInvoiceItems()
  const createInvoice = useCreateInvoice()

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contactId: '',
      issueDate: isoDaysFromNow(0),
      dueDate: '',
      number: peekNextInvoiceNumber(),
      reference: '',
      currency: 'NGN',
      taxMode: 'exclusive',
      lines: [source ? { ...blankLine(), description: source.note, qty: '1', price: String(source.amount) } : blankLine()],
      design: initialDesign,
      accent: designAccent(initialDesign),
      legalName: business?.name || DEFAULT_LEGAL_NAME,
      address: business?.address || '',
    },
  })
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

  // Preview: the printable invoice in the chosen design.
  const [previewing, setPreviewing] = useState(false)
  const [logoName, setLogoName] = useState('')
  const [uploadedLogo, setUploadedLogo] = useState('')
  const pickLogo = useImageUpload(setUploadedLogo)
  const logoUrl = uploadedLogo || business?.logo || ''

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
    number: values.number,
    reference: values.reference,
    issueDate: values.issueDate,
    dueDate: values.dueDate || values.issueDate,
    lines: watchedLines.filter(line => !isBlankLine(line)).map(line => ({ description: lineDescription(line), qty: Number(line.qty) || 0, price: Number(line.price) || 0, amount: lineAmounts(line, taxMode).amount })),
    ...totals,
    amountPaid: 0,
    balance: totals.total,
  }
  const pdf = useInvoicePdf(previewing ? doc : null)

  const save = (status: InvoiceStatus) => form.handleSubmit(async submitted => {
    const client = contact?.id === submitted.contactId ? contact.name : ''
    const filled = submitted.lines.filter(line => !isBlankLine(line))
    const { subtotal, tax, total } = invoiceTotals(filled, submitted.taxMode)
    const id = submitted.number.trim()
    try {
      await createInvoice.mutateAsync({
        id, client, amount: total, issued: submitted.issueDate, due: submitted.dueDate, status,
        clientId: submitted.contactId, clientEmail: contact?.email ?? '', clientPhone: contact?.phone ?? '',
        reference: submitted.reference.trim(), taxMode: submitted.taxMode, subtotal, tax,
        lines: filled.map(line => {
          const figures = lineAmounts(line, submitted.taxMode)
          return { description: lineDescription(line), qty: Number(line.qty) || 0, price: Number(line.price) || 0, discount: Number(line.discount) || 0, taxRate: submitted.taxMode === 'none' ? 0 : Number(line.taxRate) || 0, amount: figures.amount, tax: figures.tax }
        }),
        design: submitted.design,
        branding: { accent: submitted.accent, legalName: submitted.legalName.trim() || DEFAULT_LEGAL_NAME, address: submitted.address.trim(), logoUrl },
        createdBy: userName,
      })
    } catch (error) {
      if (error instanceof Error && /already used/.test(error.message)) form.setError('number', { message: 'This number is already used' })
      toast.error(error instanceof Error ? error.message : "Couldn't save the invoice.")
      return
    }
    toast.success(status === 'Draft' ? `${id} saved as a draft.` : status === 'Approved' ? `${id} approved.` : `${id} saved and ready to send to ${client}.`)
    navigate(generatePath(paths.invoiceDetail, { invoiceId: id }), { state: { created: true } satisfies InvoiceCreatedState })
  }, () => toast.error('Check the highlighted fields.'))

  const [saving, setSaving] = useState<InvoiceStatus | null>(null)
  const run = (status: InvoiceStatus) => async () => {
    setSaving(status)
    try { await save(status)() } finally { setSaving(null) }
  }

  return {
    form,
    lines,
    values,
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
    items: { list: itemList, loading: items.isLoading },
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
      logoName: uploadedLogo ? logoName : business?.logo ? 'Business logo' : 'No logo yet (initial shown)',
      logoUrl,
      onLogo: (file: File) => { setLogoName(file.name); void pickLogo(file) },
      show: () => setPreviewing(true),
      close: () => setPreviewing(false),
    },
    saving,
    saveDraft: run('Draft'),
    approve: run('Approved'),
    send: run('Sent'),
    back: () => navigate(paths.invoices),
    onlinePaymentsPath: paths.accounts,
  }
}

export type InvoiceFormModel = ReturnType<typeof useInvoiceForm>
