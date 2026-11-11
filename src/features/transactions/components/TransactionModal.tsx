import { ArrowDownLeft, ArrowRight, ArrowUpRight, Download, History, X } from 'lucide-react'
import type { WalletTrx } from '@/api/transactions'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { KitButton, StatusPill } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { trxChannel, trxCustomer, trxDateTime, trxShortId, trxStatus, trxTime } from '../format'

type TransactionModalProps = {
  trx: WalletTrx | null
  accountLabel: string
  onClose: () => void
  onReceipt: (trx: WalletTrx) => void
  /** Shows the "Reconcile" action. Not passed while reconciliation is switched off. */
  onReconcile?: () => void
}

/** The design's payment record. The timeline shows only what the API actually records. */
export function TransactionModal({ trx, accountLabel, onClose, onReceipt, onReconcile }: TransactionModalProps) {
  const money = useFormatMoney()
  const out = trx?.type === 'DEBIT'
  const status = trx ? trxStatus(trx.status) : ''
  const customer = trx ? trxCustomer(trx) : ''
  const pending = status === 'Pending'

  return <Modal open={Boolean(trx)} onClose={onClose} overlayClassName="bg-primary/40 p-4 backdrop-blur-sm" panelClassName="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
    {trx && <>
      <div className="flex shrink-0 items-center justify-between border-b border-border p-5">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-secondary">Payment record</p>
          <ModalTitle className="mt-1 text-sm font-extrabold">Transaction details</ModalTitle>
          <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">{trxShortId(trx.id)} · {trx.reference}</p>
        </div>
        <button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X size={17}/></button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-y-auto md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 border-b border-border bg-[#F8FAF8] p-6 md:border-b-0 md:border-r">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-secondary">{out ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}</div>
          <p className="mt-4 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">{out ? 'Money out' : 'Money received'}</p>
          <p className="mt-1 text-3xl font-extrabold [overflow-wrap:anywhere]">{out ? '−' : '+'}{money(trx.amount)}</p>
          <div className="mt-2"><StatusPill value={status}/></div>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {[['Sender / customer', customer], ['Account', accountLabel], ['Source', trxChannel(trx.channel)], ['Bank', trx.bankName || '—'], ['Date & time', trxDateTime(trx.createdAt)]].map(([label, value]) => <div key={label} className="py-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-[11px] font-extrabold [overflow-wrap:anywhere]">{value}</p></div>)}
          </div>
        </div>
        <div className="min-w-0 p-6">
          <div className="flex items-center gap-2"><History size={15} className="text-secondary"/><h3 className="text-xs font-extrabold">Transaction history</h3></div>
          <div className="mt-5">
            {[
              [trxTime(trx.createdAt), out ? 'Transfer created' : 'Payment initiated', out ? `To ${customer}` : `Sent by ${customer}`],
              ['', pending ? 'Awaiting settlement' : status === 'Completed' ? (out ? 'Debited from account' : 'Posted to account') : `Payment ${status.toLowerCase()}`, accountLabel],
            ].map(([time, title, note], index, events) => <div key={title} className="grid grid-cols-[52px_18px_minmax(0,1fr)] gap-2">
              <p className="pt-0.5 text-[8px] font-bold text-muted-foreground">{time}</p>
              <div className="flex flex-col items-center"><span className={`h-2.5 w-2.5 rounded-full border-2 ${index === events.length - 1 && pending ? 'border-[#D99A24] bg-white' : 'border-secondary bg-white'}`}/>{index < events.length - 1 && <span className="h-12 w-px bg-border"/>}</div>
              <div><p className="text-[10px] font-extrabold">{title}</p><p className="mt-1 text-[9px] text-muted-foreground [overflow-wrap:anywhere]">{note}</p></div>
            </div>)}
          </div>
          <div className="mt-6 rounded-lg border border-border p-4">
            <div className="flex justify-between gap-3 text-[10px]"><span className="text-muted-foreground">Settlement account</span><span className="truncate font-extrabold">{accountLabel}</span></div>
            <div className="mt-3 flex justify-between gap-3 text-[10px]"><span className="text-muted-foreground">Processing fee</span><span className="font-extrabold">{money(trx.charges)}</span></div>
            {trx.description && <div className="mt-3 flex justify-between gap-3 text-[10px]"><span className="shrink-0 text-muted-foreground">Description</span><span className="text-right font-extrabold [overflow-wrap:anywhere]">{trx.description}</span></div>}
          </div>
          <div className="mt-5 flex gap-2">
            <KitButton variant="secondary" className="flex-1" onClick={() => onReceipt(trx)}><Download size={14}/> Receipt</KitButton>
            {onReconcile && <KitButton className="flex-1" onClick={onReconcile}>Reconcile <ArrowRight size={14}/></KitButton>}
          </div>
        </div>
      </div>
    </>}
  </Modal>
}
