import { CalendarDays } from 'lucide-react'
import type { ScheduledPayout } from '@/api/payouts'
import { StatusPill } from '@/components/ui/PaymentKit'
import { SampleDataBadge } from '@/components/ui/misc'
import { useFormatMoney } from '@/hooks/useFormatMoney'

export function PayoutSchedule({ items, cadence }: { items: ScheduledPayout[]; cadence: string }) {
  const money = useFormatMoney()
  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="text-sm font-extrabold">Payout schedule</h2><p className="mt-1 text-[11px] text-muted-foreground">{cadence}</p></div>
      <SampleDataBadge/>
    </div>
    <div className="mt-5 flex flex-col gap-4">
      {items.map(item => <div key={item.date} className="flex items-center border-b border-border pb-4 last:border-0 last:pb-0">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-secondary"><CalendarDays size={15}/></div>
        <div className="ml-3 min-w-0"><p className="text-xs font-extrabold">{item.date}</p><p className="text-[10px] text-muted-foreground">{item.account}</p></div>
        <div className="ml-auto pl-3 text-right"><p className="mb-1 text-xs font-extrabold">{money(item.amount)}</p><StatusPill value={item.status}/></div>
      </div>)}
    </div>
  </section>
}
