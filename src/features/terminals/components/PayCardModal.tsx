import { Check, Copy, Download, Lightbulb, Printer, QrCode } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import type { TerminalsModel } from '../hooks/useTerminalsPage'
import { PayTransferCard } from './PayTransferCard'

/** sink's payment terminal: the printable "Pay with transfer" card, the store link, and print. */
export function PayCardModal({ card }: { card: TerminalsModel['payCard'] }) {
  return <KitModal
    open={card.isOpen}
    onClose={card.close}
    title="Pay with transfer"
    description="Your store's payment terminal. Print it and display it at the till so customers can pay straight into your account."
    icon={<QrCode size={16}/>}
    panelClassName="max-w-[643px]"
    bodyClassName="p-4 sm:p-6"
    footer={<>
      <KitButton variant="secondary" onClick={card.print} disabled={card.loading}><Printer size={14}/> Print</KitButton>
      <KitButton onClick={card.download} loading={card.downloading} disabled={card.loading}><Download size={14}/> Download payment terminal</KitButton>
    </>}
  >
    <PayTransferCard bankName={card.bankName} accountNumber={card.accountNumber} accountName={card.accountName} loading={card.loading}/>

    {card.storeUrl && <div className="mt-5">
      <p className="mb-1.5 text-[10px] font-extrabold">Your store URL</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input readOnly value={card.storeUrl} aria-label="Your store URL" onFocus={event => event.currentTarget.select()} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-[#F8FAF8] px-3 font-mono text-[11px] font-semibold text-foreground outline-none focus:border-secondary"/>
        <KitButton variant="secondary" onClick={card.copyUrl} className="h-11 shrink-0">{card.copied ? <Check size={14}/> : <Copy size={14}/>}{card.copied ? 'Copied' : 'Copy'}</KitButton>
      </div>
    </div>}

    <p className="mt-4 flex gap-2 rounded-xl border border-secondary/20 bg-accent p-4 text-[11px] font-semibold leading-5 text-primary"><Lightbulb size={15} className="mt-0.5 shrink-0 text-secondary"/>This is your store's customised payment terminal. Print it and display it prominently in your store to enable seamless customer payments.</p>
  </KitModal>
}
