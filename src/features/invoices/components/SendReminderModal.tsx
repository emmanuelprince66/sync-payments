import { BellRing, Info, Mail, MessageCircle, Share2, TriangleAlert } from 'lucide-react'
import { KitModal, KitTextarea } from '@/components/ui/KitExtras'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import type { InvoiceReminder } from '../hooks/useInvoiceReminder'

/** Email goes from Sync360 with the invoice link; WhatsApp and Share go from the user's device. Every reminder is logged. */
export function SendReminderModal({ model, invoiceNumber }: { model: InvoiceReminder; invoiceNumber: string }) {
  return <KitModal open={model.open} onClose={model.close} title="Send reminder" description={`${invoiceNumber} · email is sent by Sync360 with the invoice link; WhatsApp opens on your device with the message ready.`} icon={<BellRing size={16}/>}
    footer={<>
      <KitButton variant="secondary" onClick={model.close}>Cancel</KitButton>
      {model.shareSupported && <KitButton variant="secondary" disabled={model.busy} loading={model.pending === 'share'} onClick={() => void model.viaShare()}><Share2 size={14}/> Share with PDF</KitButton>}
    </>}>
    <div className="flex flex-col gap-4">
      {model.notice && <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#F0D78C] bg-[#FFF8E1] p-3 text-[11px] leading-5 text-[#6B5310]">
        <TriangleAlert size={15} className="mt-0.5 shrink-0"/>
        <div className="min-w-0">
          <p>{model.notice.text}</p>
          {model.notice.emailFallback && <button type="button" onClick={model.openEmailApp} className="mt-1 font-extrabold text-secondary hover:underline">Open my email app</button>}
        </div>
      </div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KitField label="WhatsApp number" inputMode="tel" placeholder="e.g. 0803 000 0000" value={model.phone} onChange={event => model.setPhone(event.target.value)}/>
        <div className="min-w-0">
          <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Email</span>
          <p className="flex h-12 items-center truncate rounded-xl border border-dashed border-border px-3.5 text-sm font-semibold text-foreground/80">{model.email || 'No email on file'}</p>
        </div>
      </div>
      <KitTextarea label="WhatsApp / share message" rows={9} value={model.message} onChange={event => model.setMessage(event.target.value)} className="[&_textarea]:min-h-52"/>
      {!model.hasLink && <p className="flex items-start gap-2 text-[10px] leading-4 text-muted-foreground"><Info size={13} className="mt-px shrink-0"/>This invoice has no public link yet, so the message points to the attached PDF.</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <KitButton disabled={model.busy || !model.message.trim()} loading={model.pending === 'whatsapp'} onClick={() => void model.viaWhatsApp()} className="bg-[#1FA855] hover:bg-[#178a45]"><MessageCircle size={14}/> Send on WhatsApp</KitButton>
        <KitButton variant="secondary" disabled={model.busy || !model.email} loading={model.pending === 'email'} onClick={() => void model.viaEmail()}><Mail size={14}/> Email from Sync360</KitButton>
      </div>
    </div>
  </KitModal>
}
