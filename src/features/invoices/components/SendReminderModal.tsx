import { BellRing, Mail, MessageCircle, Share2 } from 'lucide-react'
import { KitModal, KitTextarea } from '@/components/ui/KitExtras'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import type { InvoiceReminder } from '../hooks/useInvoiceReminder'

/** Prefilled reminder sent from the user's WhatsApp, email or share sheet. */
export function SendReminderModal({ model, invoiceId }: { model: InvoiceReminder; invoiceId: string }) {
  return <KitModal open={model.open} onClose={model.close} title="Send reminder" description={`${invoiceId} · the message opens in your app ready to send, and the invoice PDF downloads so you can attach it.`} icon={<BellRing size={16}/>}
    footer={<>
      <KitButton variant="secondary" onClick={model.close}>Cancel</KitButton>
      {model.shareSupported && <KitButton variant="secondary" disabled={model.busy} onClick={() => void model.viaShare()}><Share2 size={14}/> Share with PDF</KitButton>}
    </>}>
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KitField label="WhatsApp number" inputMode="tel" placeholder="e.g. 0803 000 0000" value={model.phone} onChange={event => model.setPhone(event.target.value)}/>
        <KitField label="Email" type="email" placeholder="customer@example.com" value={model.email} onChange={event => model.setEmail(event.target.value)}/>
      </div>
      <KitTextarea label="Message" rows={9} value={model.message} onChange={event => model.setMessage(event.target.value)} className="[&_textarea]:min-h-52"/>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <KitButton disabled={model.busy || !model.message.trim()} onClick={() => void model.viaWhatsApp()} className="bg-[#1FA855] hover:bg-[#178a45]"><MessageCircle size={14}/> Send on WhatsApp</KitButton>
        <KitButton variant="secondary" disabled={model.busy || !model.message.trim()} onClick={() => void model.viaEmail()}><Mail size={14}/> Send by email</KitButton>
      </div>
    </div>
  </KitModal>
}
