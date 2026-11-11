import { BellRing, CheckCircle2, CircleDollarSign, Download, FileSearch, Share2, X } from 'lucide-react'
import { KitEmpty } from '@/components/ui/KitExtras'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { BackLink, SampleDataBadge } from '@/components/ui/misc'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { InvoiceActivityCard, InvoiceAmountCard, InvoiceFactsCard, InvoicePaymentsCard } from './components/InvoiceDetailCards'
import { InvoicePdfSource, InvoicePreview } from './components/InvoicePreview'
import { InvoiceStatusPill } from './components/InvoiceStatusPill'
import { RecordPaymentModal } from './components/RecordPaymentModal'
import { SendReminderModal } from './components/SendReminderModal'
import { useInvoiceDetail, type InvoiceDetailModel } from './hooks/useInvoiceDetail'

function PdfButtons({ model, compact = false }: { model: InvoiceDetailModel; compact?: boolean }) {
  const { pdf } = model
  return <>
    <KitButton variant="secondary" className={compact ? 'whitespace-nowrap' : 'flex-1 whitespace-nowrap px-3 sm:flex-none sm:px-4'} loading={pdf.busy === 'download'} disabled={pdf.busy !== null} onClick={() => void pdf.download()}><Download size={14}/> Download PDF</KitButton>
    <KitButton variant="secondary" className={compact ? 'whitespace-nowrap' : 'flex-1 whitespace-nowrap px-3 sm:flex-none sm:px-4'} loading={pdf.busy === 'share'} disabled={pdf.busy !== null} onClick={() => void pdf.share()}><Share2 size={14}/> Share PDF</KitButton>
  </>
}

export default function InvoiceDetailPage() {
  const model = useInvoiceDetail()
  const { invoice, doc } = model

  if (model.isLoading) return <KitPage>
    <div><BackLink label="Back to invoices" onClick={model.back}/><KitPageHeader title={`Invoice ${model.invoiceId}`} subtitle="Loading invoice…" badge={<SampleDataBadge/>}/></div>
    <div className="grid gap-6 xl:grid-cols-2"><CardSkeleton lines={6}/><CardSkeleton lines={8}/></div>
  </KitPage>

  if (!invoice || !doc) return <KitPage>
    <div><BackLink label="Back to invoices" onClick={model.back}/><KitPageHeader title="Invoice not found" subtitle={`We couldn't find ${model.invoiceId}.`} badge={<SampleDataBadge/>}/></div>
    <KitEmpty icon={<FileSearch size={18}/>} title="This invoice isn't available" note="Sample invoices live in this browser tab only, so ones created before a refresh are gone." action={<KitButton onClick={model.back}>Back to invoices</KitButton>}/>
  </KitPage>

  return <KitPage>
    <div>
      <BackLink label="Back to invoices" onClick={model.back}/>
      <KitPageHeader
        title={`Invoice ${invoice.id}`}
        subtitle={`For ${invoice.client || 'a customer'} · created by ${invoice.createdBy}`}
        badge={<><InvoiceStatusPill state={model.state}/><SampleDataBadge/></>}
        actions={<div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {model.canRemind && <KitButton variant="secondary" onClick={model.reminder.start}><BellRing size={14}/> Send reminder</KitButton>}
          {model.canRecordPayment && <KitButton onClick={model.payment.start}><CircleDollarSign size={14}/> Record payment</KitButton>}
          <PdfButtons model={model} compact/>
        </div>}
      />
    </div>

    {model.justCreated && <div role="status" className="flex flex-col gap-3 rounded-2xl border border-[#CFE6D3] bg-[#F1F8F2] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-white"><CheckCircle2 size={16}/></span>
        <div><p className="text-sm font-extrabold">{invoice.id} is saved</p><p className="mt-0.5 text-xs text-muted-foreground">Download the PDF or share it with {invoice.client || 'your customer'} now.</p></div>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <PdfButtons model={model}/>
        <button type="button" aria-label="Dismiss" onClick={model.dismissCreated} className="rounded-lg p-2 text-muted-foreground hover:bg-white"><X size={16}/></button>
      </div>
    </div>}

    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <InvoiceFactsCard invoice={invoice} overdue={model.state === 'Overdue'}/>
        <InvoiceAmountCard invoice={invoice} balance={model.balance} paidPercent={model.paidPercent}/>
        <InvoicePaymentsCard invoice={invoice} action={model.canRecordPayment ? <button type="button" onClick={model.payment.start} className="text-[11px] font-extrabold text-secondary hover:underline">Record payment</button> : undefined}/>
        <InvoiceActivityCard invoice={invoice}/>
      </div>
      <section className="min-w-0 self-start overflow-hidden rounded-2xl border border-border bg-white xl:sticky xl:top-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div><h2 className="text-sm font-extrabold">Invoice PDF</h2><p className="mt-0.5 text-[10px] text-muted-foreground">{invoice.design} design · A4</p></div>
          <div className="flex w-full gap-2 sm:w-auto"><PdfButtons model={model}/></div>
        </div>
        <InvoicePreview doc={doc}/>
      </section>
    </div>

    <RecordPaymentModal model={model.payment} invoiceId={invoice.id}/>
    <SendReminderModal model={model.reminder} invoiceId={invoice.id}/>
    <InvoicePdfSource sourceRef={model.pdf.sourceRef} doc={doc}/>
  </KitPage>
}
