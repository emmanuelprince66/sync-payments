import { ArrowUpRight, Send } from 'lucide-react'
import type { WalletTrx } from '@/api/transactions'
import { KitEmpty } from '@/components/ui/KitExtras'
import { StatusPill } from '@/components/ui/PaymentKit'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { trxCustomer, trxDay, trxStatus, trxTime } from '@/features/transactions/format'

/** The latest transfers out of the wallet in the selected period. */
export function RecentTransfers({ rows, loading, money }: { rows: WalletTrx[]; loading: boolean; money: (value: number) => string }) {
  return <section className="min-w-0 rounded-2xl border border-border bg-card p-5">
    <h2 className="text-sm font-extrabold">Recent transfers</h2>
    <p className="mt-1 text-[11px] text-muted-foreground">Money sent from your wallet</p>
    {loading
      ? <ListSkeleton rows={4} className="mt-4"/>
      : rows.length === 0
        ? <KitEmpty icon={<Send size={18}/>} title="No transfers yet" note="Transfers you send in this period show up here." className="py-6"/>
        : <div className="mt-4 flex flex-col">{rows.map(row => <div key={row.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0 last:pb-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-secondary"><ArrowUpRight size={15}/></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold">{trxCustomer(row)}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{row.bankName ? `${row.bankName} · ` : ''}{trxDay(row.createdAt)}, {trxTime(row.createdAt)}</span></span>
          <span className="shrink-0 text-right"><span className="block text-xs font-extrabold">{money(row.amount)}</span><span className="mt-1 block"><StatusPill value={trxStatus(row.status)}/></span></span>
        </div>)}</div>}
  </section>
}
