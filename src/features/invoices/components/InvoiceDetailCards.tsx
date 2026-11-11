import { BellRing, CheckCircle2, CircleDollarSign, FilePlus2, Send, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Invoice, InvoiceActivityType } from '@/api/invoices'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { dateTime, longDate } from '../dates'

function Card({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl border border-border bg-white', className)}>
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><h2 className="text-sm font-extrabold">{title}</h2>{aside}</div>
    <div className="p-5">{children}</div>
  </section>
}

function Fact({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return <div className="min-w-0">
    <dt className="text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">{label}</dt>
    <dd className={cn('mt-1 break-words text-[13px] font-extrabold text-foreground', tone)}>{value || '—'}</dd>
  </div>
}

/** Client, number, dates, who created it and with which design. */
export function InvoiceFactsCard({ invoice, overdue }: { invoice: Invoice; overdue: boolean }) {
  return <Card title="Invoice details">
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
      <Fact label="Client" value={invoice.client}/>
      <Fact label="Invoice number" value={<span className="font-mono">{invoice.id}</span>}/>
      <Fact label="Date created" value={longDate(invoice.issued)}/>
      <Fact label="Due date" value={longDate(invoice.due)} tone={overdue ? 'text-[#C72D34]' : undefined}/>
      <Fact label="Created by" value={invoice.createdBy}/>
      <Fact label="Design" value={invoice.design}/>
      {invoice.reference && <Fact label="Reference" value={invoice.reference}/>}
      {(invoice.clientPhone || invoice.clientEmail) && <Fact label="Contact" value={<span className="font-bold">{[invoice.clientPhone, invoice.clientEmail].filter(Boolean).join(' · ')}</span>}/>}
    </dl>
  </Card>
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return <div className={cn('flex items-center justify-between gap-4', strong ? 'text-sm font-extrabold' : 'text-xs font-semibold text-muted-foreground', tone)}>
    <span>{label}</span><span className="tabular-nums">{value}</span>
  </div>
}

/** Subtotal → balance due, with how much has come in. */
export function InvoiceAmountCard({ invoice, balance, paidPercent }: { invoice: Invoice; balance: number; paidPercent: number }) {
  const money = useFormatMoney()
  return <Card title="Amount summary" aside={<span className="text-[10px] font-extrabold text-muted-foreground">{paidPercent}% paid</span>}>
    <div className="flex flex-col gap-3">
      <Row label="Subtotal" value={money(invoice.subtotal)}/>
      <Row label="Tax" value={money(invoice.tax)}/>
      <div className="border-t border-border pt-3"><Row label="Total" value={money(invoice.amount)} strong/></div>
      <Row label="Amount paid" value={money(invoice.amountPaid)} tone="text-secondary"/>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Paid so far" aria-valuenow={paidPercent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-secondary transition-[width]" style={{ width: `${paidPercent}%` }}/>
      </div>
      <div className="rounded-xl bg-[#F8FAF8] px-4 py-3"><Row label="Balance due" value={money(balance)} strong tone={balance > 0 ? 'text-foreground' : 'text-secondary'}/></div>
    </div>
  </Card>
}

export function InvoicePaymentsCard({ invoice, action }: { invoice: Invoice; action?: ReactNode }) {
  const money = useFormatMoney()
  return <Card title="Payments" aside={action}>
    {invoice.payments.length === 0
      ? <p className="py-2 text-xs text-muted-foreground">No payments recorded yet. When the customer pays, record it here to update the balance.</p>
      : <ul className="-my-3 divide-y divide-border">
        {invoice.payments.map(payment => <li key={payment.id} className="flex items-start justify-between gap-3 py-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E8F5EA] text-secondary"><Wallet size={15}/></span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold">{payment.method}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Paid {longDate(payment.date)} · recorded by {payment.recordedBy}</p>
              {payment.note && <p className="mt-1 break-words text-[11px] text-foreground/80">{payment.note}</p>}
            </div>
          </div>
          <p className="shrink-0 text-xs font-extrabold text-secondary">{money(payment.amount)}</p>
        </li>)}
      </ul>}
  </Card>
}

const ACTIVITY_ICON: Record<InvoiceActivityType, ReactNode> = {
  created: <FilePlus2 size={13}/>,
  approved: <CheckCircle2 size={13}/>,
  sent: <Send size={13}/>,
  reminder: <BellRing size={13}/>,
  payment: <CircleDollarSign size={13}/>,
  paid: <CheckCircle2 size={13}/>,
}

export function InvoiceActivityCard({ invoice }: { invoice: Invoice }) {
  return <Card title="Activity">
    <ol className="flex flex-col gap-4">
      {invoice.activity.map(entry => <li key={entry.id} className="flex items-start gap-3">
        <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full', entry.type === 'reminder' ? 'bg-[#FFF6E4] text-[#A76700]' : 'bg-accent text-secondary')}>{ACTIVITY_ICON[entry.type]}</span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold">{entry.message}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{dateTime(entry.at)} · {entry.by}</p>
        </div>
      </li>)}
    </ol>
  </Card>
}
