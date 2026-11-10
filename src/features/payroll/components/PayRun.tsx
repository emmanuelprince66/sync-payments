import { ShieldCheck } from 'lucide-react'
import { PAYROLL_RATES, type PayrollData } from '@/api/payroll'
import { KitButton } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { initials } from '@/lib/format'
import type { PayrollTotals } from '../hooks/usePayrollPage'

type Props = { data: PayrollData; totals: PayrollTotals; submitted: boolean; onSubmit: () => void }

export function PayRun({ data, totals, submitted, onSubmit }: Props) {
  const money = useFormatMoney()
  const approver = data.run.approver.split(' ')[0]
  return <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,.6fr)]">
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div className="min-w-0"><h2 className="text-sm font-extrabold">{data.run.title}</h2><p className="mt-1 text-[9px] text-muted-foreground">{data.run.period}</p></div>
        <span className="rounded bg-[#FFF6E4] px-2 py-1 text-[8px] font-extrabold text-[#A76700]">{submitted ? 'SUBMITTED' : 'DRAFT'}</span>
      </div>
      <div className="divide-y divide-border">
        {data.employees.map(person => <div key={person.name} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[9px] font-extrabold text-secondary">{initials(person.name)}</div>
          <div className="min-w-0"><p className="text-xs font-extrabold">{person.name}</p><p className="mt-1 text-[9px] text-muted-foreground">Gross {money(person.amount)} · Taxes {money(person.amount * PAYROLL_RATES.employeeTax)} · Benefits {money(person.amount * PAYROLL_RATES.benefits)}</p></div>
          <div className="text-right"><p className="text-xs font-extrabold">{money(person.amount * (1 - PAYROLL_RATES.employeeTax - PAYROLL_RATES.benefits))}</p><p className="mt-1 text-[8px] text-muted-foreground">Net pay</p></div>
        </div>)}
      </div>
    </section>
    <aside className="rounded-xl border border-border bg-white p-5">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Payroll summary</p>
      <p className="mt-3 break-words text-3xl font-extrabold">{money(totals.gross)}</p>
      <p className="mt-1 text-[9px] text-muted-foreground">Gross payroll</p>
      <div className="my-5 flex flex-col gap-3 border-y border-border py-4 text-[10px]">
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Employee taxes</span><span className="font-extrabold">{money(totals.employeeTaxes)}</span></div>
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Employer taxes</span><span className="font-extrabold">{money(totals.employerTaxes)}</span></div>
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Net direct deposit</span><span className="font-extrabold">{money(totals.net)}</span></div>
      </div>
      <div className="rounded-lg bg-[#FFF9EC] p-3 text-[9px] leading-4 text-muted-foreground"><ShieldCheck size={14} className="mb-2 text-[#A76700]"/>Submitting locks payroll changes and sends the run to {approver} for approval.</div>
      <KitButton disabled={submitted} onClick={onSubmit} className="mt-4 w-full">{submitted ? 'Submitted for approval' : 'Submit payroll for approval'}</KitButton>
    </aside>
  </div>
}
