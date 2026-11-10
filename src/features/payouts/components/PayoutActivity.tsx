import { Download } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { useFormatMoney } from '@/hooks/useFormatMoney'

type Props = { dateRange: DateRange | undefined; onDateRange: (value: DateRange | undefined) => void; chart: { day: string; value: number }[]; isEmpty: boolean; isLoading: boolean; isError: boolean; hasBank: boolean; onExport: () => void }

const compact = new Intl.NumberFormat('en-US', { notation: 'compact' })

function ActivityMessage({ children }: { children: string }) {
  return <div className="grid h-[220px] place-items-center rounded-xl bg-[#F8FAF8] px-5 text-center text-xs font-semibold text-muted-foreground">{children}</div>
}

export function PayoutActivity({ dateRange, onDateRange, chart, isEmpty, isLoading, isError, hasBank, onExport }: Props) {
  const money = useFormatMoney()
  const message = isError ? 'We could not load your payouts. Try again shortly.' : !hasBank ? 'Open an account to start sending payouts.' : isEmpty ? 'No payouts in this period.' : null
  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><h2 className="text-sm font-extrabold">Payout activity</h2><p className="mt-1 text-[11px] text-muted-foreground">Daily payout volume</p></div>
      <div className="flex min-w-0 gap-2">
        <DateRangeFilter value={dateRange} onChange={onDateRange} placeholder="Last 7 days" className="min-w-0 flex-1 sm:flex-none"/>
        <KitButton variant="secondary" onClick={onExport} className="shrink-0"><Download size={13}/> Export</KitButton>
      </div>
    </div>
    {isLoading
      ? <Skeleton className="h-[220px] w-full"/>
      : message
        ? <ActivityMessage>{message}</ActivityMessage>
        : <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chart}>
            <defs><linearGradient id="payoutArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#529661" stopOpacity={0.25}/><stop offset="100%" stopColor="#529661" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#E8EEE8" strokeDasharray="3 3"/>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718071' }}/>
            <YAxis width={40} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718071' }} tickFormatter={value => compact.format(Number(value))}/>
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8E2', fontSize: 11 }} formatter={value => [money(Number(value)), 'Payouts']}/>
            <Area type="monotone" dataKey="value" stroke="#529661" strokeWidth={2.5} fill="url(#payoutArea)"/>
          </AreaChart>
        </ResponsiveContainer>}
  </section>
}
