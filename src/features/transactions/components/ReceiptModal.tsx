import { Download } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { Logo } from '@/components/ui/Logo'
import { KitButton, StatusPill } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { trxDateTime } from '../format'
import type { ReceiptDetails } from '../types'

function Row({ label, value }: { label: string; value?: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-border py-3 text-[10px] last:border-0"><span className="shrink-0 text-muted-foreground">{label}</span><span className="break-all text-right font-extrabold">{value || '—'}</span></div>
}

/** sink: TransferReceipt, printable after a transfer or from a transaction. */
export function ReceiptModal({ receipt, onClose }: { receipt: ReceiptDetails | null; onClose: () => void }) {
  const money = useFormatMoney()
  return <KitModal
    open={Boolean(receipt)}
    onClose={onClose}
    title="Transfer receipt"
    panelClassName="max-w-md"
    footer={<><KitButton variant="secondary" onClick={onClose}>Back</KitButton><KitButton onClick={() => window.print()}><Download size={14}/> Print / save</KitButton></>}
  >
    {receipt && <div id="transfer-receipt" className="rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between gap-3"><Logo/><StatusPill value={receipt.status}/></div>
      <p className="mt-5 text-center text-3xl font-extrabold [overflow-wrap:anywhere]">{money(receipt.amount)}</p>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">{trxDateTime(receipt.date)}</p>
      <div className="mt-5">
        {receipt.senderName && <Row label="From" value={receipt.senderName}/>}
        <Row label="Beneficiary" value={receipt.beneficiaryName}/>
        <Row label="Account number" value={receipt.beneficiaryAccount}/>
        <Row label="Bank" value={receipt.beneficiaryBank}/>
        {receipt.narration && <Row label="Narration" value={receipt.narration}/>}
        <Row label="Transaction ID" value={receipt.transactionId}/>
      </div>
    </div>}
  </KitModal>
}
