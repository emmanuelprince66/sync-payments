import { Download, Eye, Share2 } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import type { InvoiceFormModel } from '../hooks/useInvoiceForm'
import { InvoiceBrandCard } from './InvoiceBrandCard'
import { InvoiceDesignPicker } from './InvoiceDesignPicker'
import { InvoicePdfSource, InvoicePreview } from './InvoicePreview'

/** The invoice as the customer sees it, in the chosen design, with design and branding controls beside it. */
export function InvoicePreviewModal({ model }: { model: InvoiceFormModel }) {
  const { preview } = model
  const { pdf } = preview
  return <KitModal open={preview.open} onClose={preview.close} title="Preview invoice" description={`${model.design.value} design · change the design or branding and the preview updates`} icon={<Eye size={16}/>} panelClassName="max-w-6xl" bodyClassName="p-0"
    footer={<>
      <KitButton variant="secondary" onClick={preview.close}>Back to editing</KitButton>
      <div className="flex gap-2">
        <KitButton variant="secondary" loading={pdf.busy === 'download'} disabled={pdf.busy !== null} onClick={() => void pdf.download()}><Download size={14}/> <span className="hidden sm:inline">Download</span> PDF</KitButton>
        {pdf.shareSupported && <KitButton variant="secondary" loading={pdf.busy === 'share'} disabled={pdf.busy !== null} onClick={() => void pdf.share()}><Share2 size={14}/> Share</KitButton>}
      </div>
    </>}>
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r">
        <InvoiceDesignPicker value={model.design.value} onChange={model.design.choose} compact/>
        <InvoiceBrandCard form={model.form} logoName={preview.logoName} logoUrl={preview.logoUrl} onLogo={preview.onLogo}/>
      </div>
      <InvoicePreview doc={preview.doc}/>
    </div>
    {preview.open && <InvoicePdfSource sourceRef={pdf.sourceRef} doc={preview.doc}/>}
  </KitModal>
}
