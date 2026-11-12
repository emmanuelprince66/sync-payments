import { Check, Eye, Save, Send } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { BackLink } from '@/components/ui/misc'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { InvoiceAccessNotice } from './components/InvoiceAccessNotice'
import { InvoiceDesignPicker } from './components/InvoiceDesignPicker'
import { InvoiceHeaderFields } from './components/InvoiceHeaderFields'
import { InvoiceLineTable, InvoiceTotals } from './components/InvoiceLineTable'
import { InvoicePreviewModal } from './components/InvoicePreviewModal'
import { NewContactModal, NewItemModal } from './components/InvoiceQuickCreateModals'
import { useInvoiceForm } from './hooks/useInvoiceForm'

/** New invoice, and Edit draft (`/invoices/:invoiceId/edit`): drafts are the only invoices whose fields can change. */
export default function CreateInvoicePage() {
  const model = useInvoiceForm()
  const busy = model.saving !== null
  const title = model.editing ? `Edit ${model.number.value || 'draft'}` : 'New invoice'
  const backLabel = model.editing ? 'Back to invoice' : 'Back to invoices'

  if (model.loadingDraft) return <KitPage>
    <div><BackLink label={backLabel} onClick={model.back}/><KitPageHeader title="Edit draft" subtitle="Loading the draft…"/></div>
    <CardSkeleton lines={6}/>
  </KitPage>

  if (model.blocked) return <KitPage>
    <div><BackLink label={backLabel} onClick={model.back}/><KitPageHeader title={title} subtitle="This invoice can't be edited"/></div>
    <InvoiceAccessNotice forbidden={model.blocked.forbidden} message={model.blocked.message}/>
  </KitPage>

  return <KitPage className="pb-0 md:pb-0">
    <div>
      <BackLink label={backLabel} onClick={model.back}/>
      <KitPageHeader title={title} subtitle={model.editing
        ? 'Change anything while it is a draft. Approving it locks the details.'
        : 'Bill a customer in one of three designs. Save it as a draft, approve it, or save and send it.'}/>
    </div>

    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <InvoiceHeaderFields model={model}/>
    </section>

    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <InvoiceDesignPicker value={model.design.value} onChange={model.design.choose} accent={model.values.accent}/>
      <button type="button" onClick={model.preview.show} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-secondary hover:underline"><Eye size={13}/> Preview and edit branding</button>
    </section>

    <InvoiceLineTable model={model}/>
    <InvoiceTotals totals={model.totals}/>

    {/* Pinned on wider screens so the actions stay in reach; on phones it simply ends the form, as in Xero. */}
    <div className="-mx-5 flex flex-col gap-2 border-t border-border bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:sticky md:bottom-0 md:z-20 md:-mx-8 md:px-8">
      <KitButton variant="secondary" onClick={model.preview.show} className="order-last sm:order-none"><Eye size={14}/> Preview</KitButton>
      <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 sm:flex">
        <KitButton variant="secondary" loading={model.saving === 'Draft'} disabled={busy} onClick={model.saveDraft}><Save size={14}/> Save draft</KitButton>
        <KitButton variant="secondary" loading={model.saving === 'Approved'} disabled={busy} onClick={model.approve}><Check size={14}/> Approve</KitButton>
        <KitButton className="col-span-2" loading={model.saving === 'Sent'} disabled={busy} onClick={model.send}><Send size={14}/> Save &amp; send</KitButton>
      </div>
    </div>

    <NewContactModal model={model.contactForm}/>
    <NewItemModal model={model.itemForm}/>
    <InvoicePreviewModal model={model}/>
  </KitPage>
}
