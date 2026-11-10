import { Eye, Printer } from 'lucide-react'
import type { Ref } from 'react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import type { InvoiceFormModel } from '../hooks/useInvoiceForm'
import { InvoiceBrandCard } from './InvoiceBrandCard'
import { InvoicePreview } from './InvoicePreview'

/** The invoice as the customer sees it, in the chosen template, with the branding controls beside it. */
export function InvoicePreviewModal({ model, previewRef }: { model: InvoiceFormModel; previewRef: Ref<HTMLDivElement> }) {
  const { preview } = model
  return <KitModal open={preview.open} onClose={preview.close} title="Preview invoice" description={`${model.template} template · edit branding on the left`} icon={<Eye size={16}/>} panelClassName="max-w-5xl" bodyClassName="p-0"
    footer={<><KitButton variant="secondary" onClick={preview.close}>Back to editing</KitButton><KitButton variant="secondary" onClick={preview.print}><Printer size={14}/> Print / PDF</KitButton></>}>
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <div className="border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r"><InvoiceBrandCard form={model.form} logoName={preview.logoName} logoUrl={preview.logoUrl} onLogo={preview.onLogo}/></div>
      <InvoicePreview ref={previewRef} template={model.template} preview={preview.model}/>
    </div>
  </KitModal>
}
