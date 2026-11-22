import { CalendarClock, ReceiptText, UsersRound, WalletCards } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'

const PREVIEW = [
  { icon: UsersRound, title: 'Employees', text: 'Keep everyone’s salary, bank details and role in one place.' },
  { icon: CalendarClock, title: 'Pay runs', text: 'Schedule salaries and pay the whole team from your wallet in one go.' },
  { icon: ReceiptText, title: 'Taxes & deductions', text: 'PAYE, pension and other deductions worked out for every run.' },
  { icon: WalletCards, title: 'Payslips', text: 'A payslip for each employee after every run.' },
]

/**
 * Payroll isn't live yet: this stands in for PayrollPage (features/payroll, kept as it is) until it is.
 * Switch it back in routes/pages.ts when payroll launches.
 */
export default function PayrollComingSoon() {
  return <KitPage>
    <KitPageHeader eyebrow="People operations" title="Payroll" subtitle="Pay your team straight from your Sync Pay wallet." badge={<span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-extrabold text-brand">Coming soon</span>}/>

    <section className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="hero-gradient p-6 text-white sm:p-8">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/55">Coming soon</p>
        <h2 className="mt-2 max-w-lg text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">Payroll is on its way.</h2>
        <p className="mt-2 max-w-lg text-xs leading-5 text-white/65">We’re finishing payroll so you can pay salaries, handle deductions and send payslips without leaving Sync Pay. We’ll let you know as soon as it’s ready.</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-border sm:grid-cols-2">
        {PREVIEW.map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3 bg-white p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-brand"><Icon size={17}/></span>
          <div className="min-w-0"><p className="text-sm font-extrabold">{title}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{text}</p></div>
        </div>)}
      </div>
    </section>
  </KitPage>
}
