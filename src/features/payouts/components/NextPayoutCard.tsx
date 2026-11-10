import { Landmark } from 'lucide-react'
import type { NextPayout } from '@/api/payouts'
import { SampleDataBadge } from '@/components/ui/misc'
import { useFormatMoney } from '@/hooks/useFormatMoney'

export function NextPayoutCard({ next }: { next: NextPayout }) {
  const money = useFormatMoney()
  return <section className="relative overflow-hidden rounded-[22px] bg-primary p-7 text-white">
    <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full border-[36px] border-white/[.04]"/>
    <div className="relative flex flex-wrap items-center justify-between gap-2">
      <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-white/50">Next automatic payout</p>
      <SampleDataBadge/>
    </div>
    <p className="relative mt-3 break-words text-4xl font-extrabold">{money(next.amount)}</p>
    <div className="mt-7 flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10"><Landmark size={18}/></div>
      <div className="min-w-0"><p className="text-xs font-extrabold">{next.account}</p><p className="mt-1 text-[10px] text-white/50">{next.arrival}</p></div>
    </div>
    <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-secondary"/></div>
    <div className="mt-2 flex justify-between text-[9px] font-bold text-white/45"><span>Processing</span><span>Bank arrival</span></div>
  </section>
}
