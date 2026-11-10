import { ArrowRight, Banknote, CalendarDays, FileCheck2, Send } from 'lucide-react'
import type { PayrollData } from '@/api/payroll'
import { KitButton, KitStatCard } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import type { PayrollTab, PayrollTotals } from '../hooks/usePayrollPage'

type Props = { data: PayrollData; totals: PayrollTotals; onOpenRun: () => void; onTask: (tab: PayrollTab) => void }

export function PayrollOverview({ data, totals, onOpenRun, onTask }: Props) {
  const money = useFormatMoney()
  return <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KitStatCard label="Next payroll" value={money(totals.gross)} note={`${data.run.payDate} · ${totals.headcount} employees`} icon={CalendarDays}/>
      <KitStatCard label="Gross wages MTD" value={money(totals.gross)} note="Regular + variable pay" icon={Banknote} tone="blue"/>
      <KitStatCard label="Taxes & deductions" value={money(totals.deductions)} note="Withheld and payable" icon={FileCheck2} tone="amber"/>
      <KitStatCard label="Net payroll" value={money(totals.net)} note="Direct deposit total" icon={Send}/>
    </div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)]">
      <section className="rounded-xl border border-border bg-white p-5">
        <div className="flex justify-between gap-3">
          <div className="min-w-0"><h2 className="text-sm font-extrabold">Payroll calendar</h2><p className="mt-1 text-[9px] text-muted-foreground">Current semi-monthly cycle</p></div>
          <KitButton variant="secondary" className="shrink-0" onClick={onOpenRun}>Open pay run</KitButton>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {data.calendar.map((item, index) => <div key={item.title} className="relative min-w-0">
            <div className={cn('mb-3 h-1', item.done ? 'bg-secondary' : 'bg-muted', index === 0 && 'rounded-l-full', index === data.calendar.length - 1 && 'rounded-r-full')}/>
            <p className="text-[9px] font-extrabold">{item.date}</p>
            <p className="mt-1 text-[8px] text-muted-foreground">{item.title}</p>
          </div>)}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-extrabold">Tasks before payday</h2>
        <div className="mt-4 flex flex-col gap-4">
          {data.tasks.map((task, index) => <button key={task.task} type="button" onClick={() => onTask(task.tab)} className="flex w-full items-center text-left">
            <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-extrabold', index === 0 ? 'bg-[#FFF6E4] text-[#A76700]' : 'bg-muted text-muted-foreground')}>{index + 1}</span>
            <span className="ml-3 min-w-0"><b className="block text-[10px]">{task.task}</b><i className="mt-0.5 block text-[8px] not-italic text-muted-foreground">{task.due}</i></span>
            <ArrowRight size={12} className="ml-auto shrink-0"/>
          </button>)}
        </div>
      </section>
    </div>
  </>
}
