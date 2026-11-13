import { Send } from 'lucide-react'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'

/** sink's Transfer Funds header: the balance that can be sent, and the way in to the transfer. */
export function TransferBalanceCard({ balance, sent, sentNote, loading, onTransfer }: { balance: string; sent: string; sentNote: string; loading: boolean; onTransfer?: () => void }) {
  return <section className="relative flex min-w-0 flex-col overflow-hidden rounded-[22px] bg-primary p-6 text-white sm:p-7">
    <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full border-[36px] border-white/[.04]"/>
    <p className="relative text-xs text-white/70">Available Balance</p>
    {loading ? <Skeleton className="relative mt-2 h-10 w-48 bg-white/10"/> : <p className="relative mt-1 text-4xl font-extrabold tracking-tight [overflow-wrap:anywhere]">{balance}</p>}
    <p className="relative mt-2 text-[11px] text-white/60">Your funds are ready to be transferred.</p>
    <div className="relative mt-auto flex flex-col gap-4 pt-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-white/50">Sent this period</p><p className="mt-1 text-lg font-extrabold [overflow-wrap:anywhere]">{sent}</p><p className="text-[10px] text-white/50">{sentNote}</p></div>
      {onTransfer && <KitButton onClick={onTransfer} className="h-11 shrink-0 bg-secondary px-5 text-white hover:bg-[#438351]"><Send size={14}/> Transfer Funds</KitButton>}
    </div>
  </section>
}
