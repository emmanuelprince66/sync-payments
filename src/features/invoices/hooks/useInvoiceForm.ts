import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useCustomerSearch } from '@/api/customers'
import { peekNextInvoiceNumber, useCreateInvoice, useInvoiceItems, type InvoiceItem, type InvoiceStatus } from '@/api/invoices'
import { useImageUpload } from '@/hooks/useImageUpload'
import { paths } from '@/routes/paths'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { DEFAULT_ACCOUNT, DEFAULT_TAX_RATE, INVOICE_TEMPLATES, type InvoiceTemplate, type OptionalColumn } from '../constants'
import { isoDaysFromNow } from '../dates'
import { printPreview } from '../printPreview'
import { invoiceSchema, isBlankLine, type InvoiceFormValues, type InvoiceLine } from '../schemas'
import { invoiceTotals, lineAmounts } from '../totals'
import { useNewContactForm, useNewItemForm } from './useInvoiceQuickCreate'

/** Prefill handed over from another screen, e.g. "Create invoice" on an expense. */
export type InvoiceDraft = { client: string; amount: number; note: string }
type IncomingState = { draft?: InvoiceDraft; template?: InvoiceTemplate } | null

const DEFAULT_LEGAL_NAME = 'Your business'
const MAX_FILES = 10

type PickedContact = { id: string; name: string; email: string }

const blankLine = (): InvoiceLine => ({ itemId: '', description: '', qty: '', price: '', discount: '', account: DEFAULT_ACCOUNT, taxRate: DEFAULT_TAX_RATE })

export type InvoicePreviewModel = {
  accent: string
  letterhead: InvoiceFormValues['letterhead']
  legalName: string
  address: string
  party: string
  partyEmail: string
  number: string
  documentNumber: string
  issueDate: string
  dueDate: string
  lines: { description: string; amount: number }[]
  subtotal: number
  tax: number
  total: number
  logoUrl: string
}

/** Everything the Create invoice screen shows and does. Invoices are sample data, so nothing reaches a server. */
export function useInvoiceForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const incoming = location.state as IncomingState
  const [source] = useState(() => incoming?.draft ?? null)
  const [template] = useState<InvoiceTemplate>(() => incoming?.template ?? 'Classic')
  const business = useBusinessDataStore(state => state.businessData)

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
      accent: INVOICE_TEMPLATES.find(item => item.name === template)?.accent ?? INVOICE_TEMPLATES[0].accent,
      letterhead: 'Top',
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

  const contactForm = useNewContactForm(created => pickContact({ id: created.id, name: created.name, email: created.email }))
  const itemForm = useNewItemForm(applyItem)

  // Preview: the printable invoice in the chosen template.
  const [previewing, setPreviewing] = useState(false)
  const [logoName, setLogoName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const pickLogo = useImageUpload(setLogoUrl)
  const previewRef = useRef<HTMLDivElement>(null)
  const preview: InvoicePreviewModel = {
    accent: values.accent,
    letterhead: values.letterhead,
    legalName: values.legalName,
    address: values.address,
    party: contact?.name || 'Your customer',
    partyEmail: contact?.email || '',
    number: values.number,
    documentNumber: values.number.replace(/^\D+/, ''),
    issueDate: values.issueDate,
    dueDate: values.dueDate || values.issueDate,
    lines: watchedLines.filter(line => !isBlankLine(line)).map(line => ({ description: line.description || itemList.find(item => item.id === line.itemId)?.name || 'Item', amount: lineAmounts(line, taxMode).amount })),
    ...totals,
    logoUrl,
  }

  const save = (status: InvoiceStatus) => form.handleSubmit(async submitted => {
    const client = contact?.id === submitted.contactId ? contact.name : ''
    const { total } = invoiceTotals(submitted.lines.filter(line => !isBlankLine(line)), submitted.taxMode)
    await createInvoice.mutateAsync({ id: submitted.number.trim(), client, amount: total, issued: submitted.issueDate, due: submitted.dueDate, status })
    toast.success(status === 'Draft' ? `${submitted.number} saved as a draft.` : status === 'Approved' ? `${submitted.number} approved.` : `${submitted.number} sent to ${client}.`)
    navigate(paths.invoices)
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
    template,
    contacts: {
      options: customers.customers.map(item => ({ value: item.id, label: item.name, hint: [item.phone, item.email].filter(Boolean).join(' · ') })),
      loading: customers.isLoading || customers.isFetching,
      selected: contact,
      setQuery: setContactQuery,
      pick: (id: string) => {
        const found = customers.customers.find(item => item.id === id)
        if (found) pickContact({ id: found.id, name: found.name, email: found.email })
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
    /** The printable preview's node, for Print / PDF. */
    previewRef,
    preview: {
      open: previewing,
      model: preview,
      logoName: logoUrl ? logoName : 'Sync360 mark',
      logoUrl,
      onLogo: (file: File) => { setLogoName(file.name); void pickLogo(file) },
      show: () => setPreviewing(true),
      close: () => setPreviewing(false),
      print: () => { if (!printPreview(previewRef.current, values.number)) toast.error('Allow pop-ups to preview the PDF.') },
    },
    saving,
    saveDraft: run('Draft'),
    approve: run('Approved'),
    send: run('Sent'),
    back: () => navigate(paths.invoices),
    onlinePaymentsPath: paths.accounts,
  }
}

/** What the screen's components receive; the preview ref is passed on its own. */
export type InvoiceFormModel = Omit<ReturnType<typeof useInvoiceForm>, 'previewRef'>
