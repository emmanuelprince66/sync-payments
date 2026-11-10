import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react'
import type { WalletRow } from '@/api/branches'
import { formatActivityDate } from '@/api/http'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { StatusPill } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'

export function BranchTransactionModal({ row, branchName, onClose }: { row: WalletRow; branchName?: string; onClose: () => void }) {
  const money = useFormatMoney()
  const isDebit = row.type === 'DEBIT'
  const details: [string, string][] = [
    ['Sender / customer', row.counterparty],
    ['Branch', branchName ?? '—'],
    ['Source', row.channel],
    ['Description', row.description || '—'],
    ['Date & time', formatActivityDate(row.createdAt)],
  ]
  return <Modal open onClose={onClose} overlayClassName="bg-primary/40 p-4 backdrop-blur-sm" panelClassName="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b border-border p-5">
      <div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-secondary">Payment record</p><ModalTitle className="mt-1 text-sm font-extrabold">Transaction details</ModalTitle><p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">{row.reference}</p></div>
      <button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X size={17}/></button>
    </div>
    <div className="bg-[#F8FAF8] p-6">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-secondary">{isDebit ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}</div>
      <p className="mt-4 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">{isDebit ? 'Money out' : 'Money received'}</p>
      <p className="mt-1 break-words text-3xl font-extrabold">{isDebit ? '−' : '+'}{money(row.amount)}</p>
      <div className="mt-2"><StatusPill value={row.status}/></div>
      <div className="mt-6 divide-y divide-border border-y border-border">
        {details.map(([label, value]) => <div key={label} className="py-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 break-words text-[11px] font-extrabold">{value}</p></div>)}
      </div>
    </div>
  </Modal>
}
