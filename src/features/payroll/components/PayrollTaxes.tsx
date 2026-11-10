import type { PayrollData } from '@/api/payroll'
import { useFormatMoney } from '@/hooks/useFormatMoney'

export function PayrollTaxes({ data }: { data: PayrollData }) {
  const money = useFormatMoney()
  const total = data.liabilities.reduce((sum, item) => sum + item.amount, 0)
  return <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <section className="rounded-xl border border-border bg-white p-5">
      <div className="flex justify-between gap-3">
        <div className="min-w-0"><h2 className="text-sm font-extrabold">Tax liabilities</h2><p className="mt-1 text-[9px] text-muted-foreground">Current quarter</p></div>
        <p className="text-xl font-extrabold">{money(total)}</p>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {data.liabilities.map(item => <div key={item.name} className="flex items-center border-b border-border pb-3">
          <div className="min-w-0"><p className="text-[10px] font-extrabold">{item.name}</p><p className="mt-1 text-[8px] text-muted-foreground">Due {item.due}</p></div>
          <p className="ml-auto pl-3 text-xs font-extrabold">{money(item.amount)}</p>
        </div>)}
      </div>
    </section>
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-sm font-extrabold">Filings & compliance</h2>
      <div className="mt-5 flex flex-col gap-3">
        {data.filings.map(filing => <div key={filing.form} className="rounded-lg border border-border p-4">
          <div className="flex justify-between gap-3"><p className="min-w-0 text-[10px] font-extrabold">{filing.form}</p><span className="shrink-0 text-[8px] font-extrabold text-secondary">{filing.status}</span></div>
          <p className="mt-2 text-[8px] text-muted-foreground">Due {filing.due}</p>
        </div>)}
      </div>
    </section>
  </div>
}
