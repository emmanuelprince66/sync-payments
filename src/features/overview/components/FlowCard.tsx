import { BarChart3 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { KitEmpty } from '@/components/ui/KitExtras'
import { Skeleton } from '@/components/ui/Skeleton'
import type { OverviewModel } from '../hooks/useOverviewPage'

/** The design's "Payment flow" bars, from the selected period's wallet transactions. */
export function FlowCard({ page }: { page: OverviewModel }) {
  return <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_rgba(29,38,28,.035)]">
    <div className="mb-5 min-w-0"><h2 className="text-sm font-extrabold text-foreground">Payment flow</h2><p className="mt-1 text-[11px] text-muted-foreground">Money collected and paid out in the selected period</p></div>
    <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-bold text-muted-foreground">
      <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-secondary"/> Inflow</span>
      <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-primary"/> Payouts</span>
      {page.sales && <span className="sm:ml-auto">Sales revenue {page.sales.revenue} · {page.sales.change}</span>}
    </div>
    {page.loading
      ? <Skeleton className="h-[210px] w-full rounded-xl"/>
      : page.flow.length === 0
        ? <KitEmpty icon={<BarChart3 size={18}/>} title="No payments in this period" note="Inflow and payouts appear here as money moves." className="h-[210px] justify-center py-0"/>
        : <ResponsiveContainer width="100%" height={210}>
          <BarChart data={page.flow} barGap={4}>
            <CartesianGrid vertical={false} stroke="#E8EEE8" strokeDasharray="3 3"/>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718071' }}/>
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718071' }} tickFormatter={page.axisTick} width={46}/>
            <Tooltip cursor={{ fill: '#F4F6F4' }} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8E2', fontSize: 11 }} formatter={value => page.tooltipValue(Number(value))}/>
            <Bar dataKey="inflow" name="Inflow" fill="#529661" radius={[5, 5, 0, 0]}/>
            <Bar dataKey="payout" name="Payouts" fill="#1D261C" radius={[5, 5, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>}
  </section>
}
