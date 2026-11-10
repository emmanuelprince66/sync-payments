import { Check, Copy, Printer, QrCode } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { groupAccount } from '@/features/transactions/format'
import type { TerminalsModel } from '../hooks/useTerminalsPage'

/** sink's "Pay with transfer" card: the details to print and put at the till. */
export function PayCardModal({ card }: { card: TerminalsModel['payCard'] }) {
  return <KitModal
    open={card.isOpen}
    onClose={card.close}
    title="Pay with transfer"
    description="Print this and put it at the till, so customers can pay straight into your account."
    icon={<QrCode size={16}/>}
    panelClassName="max-w-md"
    footer={<>
      <KitButton variant="secondary" onClick={card.copyUrl} disabled={!card.storeUrl}>{card.copied ? <Check size={14}/> : <Copy size={14}/>}{card.copied ? 'Copied' : 'Copy link'}</KitButton>
      <KitButton onClick={card.print}><Printer size={14}/> Print</KitButton>
    </>}
  >
    <div className="rounded-2xl bg-[#F8FAF8] p-5 text-center">
      {[['Bank name', card.bankName], ['Account number', card.accountNumber ? groupAccount(card.accountNumber) : ''], ['Account name', card.accountName]].map(([label, value], index) => <div key={label} className={index ? 'mt-4 border-t border-border pt-4' : ''}>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</p>
        {card.loading ? <Skeleton className="mx-auto mt-2 h-5 w-40"/> : <p className="mt-1.5 text-lg font-extrabold [overflow-wrap:anywhere]">{value || '—'}</p>}
      </div>)}
    </div>
    {card.storeUrl && <p className="mt-4 text-center text-[10px] text-muted-foreground [overflow-wrap:anywhere]">{card.storeUrl}</p>}
  </KitModal>
}
