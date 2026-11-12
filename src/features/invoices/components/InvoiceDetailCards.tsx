import { Ban, BellRing, Check, CheckCircle2, CircleDollarSign, Copy, ExternalLink, Eye, FilePen, FilePlus2, Link2, Send, Share2, Undo2, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Invoice, InvoiceActivityType, InvoicePayment } from '@/api/invoices'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { dateTime, longDate } from '../dates'
import type { InvoiceActions } from '../hooks/useInvoiceActions'

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
  return <Card title="Invoice details" aside={<span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">{invoice.status}</span>}>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
      <Fact label="Client" value={invoice.client}/>
      <Fact label="Invoice number" value={<span className="font-mono">{invoice.number}</span>}/>
      <Fact label="Issue date" value={longDate(invoice.issued)}/>
      <Fact label="Due date" value={longDate(invoice.due)} tone={overdue ? 'text-[#C72D34]' : undefined}/>
      <Fact label="Created by" value={invoice.createdBy}/>
      <Fact label="Design" value={invoice.design}/>
      {invoice.reference && <Fact label="Reference" value={<span className="font-mono">{invoice.reference}</span>}/>}
      {(invoice.clientPhone || invoice.clientEmail) && <Fact label="Contact" value={<span className="font-bold">{[invoice.clientPhone, invoice.clientEmail].filter(Boolean).join(' · ')}</span>}/>}
      {invoice.note && <Fact label="Note" value={<span className="font-semibold">{invoice.note}</span>}/>}
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

/** The customer-facing link (Sent and later): copy, share or open it. */
export function InvoicePublicLinkCard({ link, viewed }: { link: InvoiceActions['publicLink']; viewed: boolean }) {
  return <Card title="Customer link" aside={viewed ? <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#4A5D86]"><Eye size={12}/> Viewed</span> : <span className="text-[10px] font-bold text-muted-foreground">Not opened yet</span>}>
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#F8FAF8] px-3 py-2.5">
      <Link2 size={14} className="shrink-0 text-secondary"/>
      <a href={link.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-[11px] font-bold text-foreground hover:text-secondary">{link.url}</a>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2">
      <KitButton variant="secondary" className="px-2" onClick={link.copy}>{link.copied ? <Check size={14}/> : <Copy size={14}/>} {link.copied ? 'Copied' : 'Copy'}</KitButton>
      <KitButton variant="secondary" className="px-2" onClick={() => void (link.canShare ? link.share() : link.copy())}><Share2 size={14}/> Share</KitButton>
      <KitButton variant="secondary" className="px-2" onClick={link.open}><ExternalLink size={14}/> Open</KitButton>
    </div>
    <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Your customer can view and pay the invoice from this link. Reminders include it.</p>
  </Card>
}

export function InvoicePaymentsCard({ invoice, action, onReverse }: { invoice: Invoice; action?: ReactNode; onReverse?: (payment: InvoicePayment) => void }) {
  const money = useFormatMoney()
  return <Card title="Payments" aside={action}>
    {invoice.payments.length === 0
      ? <p className="py-2 text-xs text-muted-foreground">No payments recorded yet. When the customer pays, record it here to update the balance.</p>
      : <ul className="-my-3 divide-y divide-border">
        {invoice.payments.map(payment => <li key={payment.id} className={cn('flex items-start justify-between gap-3 py-3', payment.reversed && 'opacity-60')}>
          <div className="flex min-w-0 items-start gap-3">
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', payment.reversed ? 'bg-muted text-muted-foreground' : 'bg-[#E8F5EA] text-secondary')}>{payment.reversed ? <Undo2 size={15}/> : <Wallet size={15}/>}</span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold">{payment.method}{payment.reversed && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.08em] text-muted-foreground">Reversed</span>}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Paid {longDate(payment.date)}{payment.recordedBy && ` · recorded by ${payment.recordedBy}`}{payment.reversed && payment.reversedAt && ` · reversed ${dateTime(payment.reversedAt)}`}</p>
              {payment.note && <p className="mt-1 break-words text-[11px] text-foreground/80">{payment.note}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <p className={cn('text-xs font-extrabold', payment.reversed ? 'text-muted-foreground line-through' : 'text-secondary')}>{money(payment.amount)}</p>
            {onReverse && !payment.reversed && <button type="button" onClick={() => onReverse(payment)} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#C72D34] hover:underline"><Undo2 size={11}/> Reverse</button>}
          </div>
        </li>)}
      </ul>}
  </Card>
}

/** Confirms a soft reversal. */
export function ReversePaymentModal({ model }: { model: InvoiceActions['reversal'] }) {
  const money = useFormatMoney()
  const payment = model.payment
  return <KitModal open={Boolean(payment)} onClose={model.cancel} title="Reverse payment" icon={<Undo2 size={16}/>} panelClassName="max-w-md"
    footer={<>
      <KitButton variant="secondary" onClick={model.cancel} disabled={model.busy}>Cancel</KitButton>
      <KitButton onClick={() => void model.confirm()} loading={model.busy} className="bg-[#C72D34] shadow-none hover:bg-[#A9252B]">Reverse payment</KitButton>
    </>}>
    <p className="text-xs leading-5 text-muted-foreground">Reverse the <span className="font-extrabold text-foreground">{payment ? money(payment.amount) : ''}</span> {payment?.method.toLowerCase()} payment from {payment ? longDate(payment.date) : ''}? It stays in the payment history, stops counting toward the amount paid, and a paid invoice goes back to Sent.</p>
  </KitModal>
}

const ACTIVITY_ICON: Record<InvoiceActivityType, ReactNode> = {
  created: <FilePlus2 size={13}/>,
  updated: <FilePen size={13}/>,
  approved: <CheckCircle2 size={13}/>,
  sent: <Send size={13}/>,
  viewed: <Eye size={13}/>,
  reminder: <BellRing size={13}/>,
  payment: <CircleDollarSign size={13}/>,
  payment_reversed: <Undo2 size={13}/>,
  paid: <CheckCircle2 size={13}/>,
  voided: <Ban size={13}/>,
}

const ACTIVITY_TONE: Partial<Record<InvoiceActivityType, string>> = {
  reminder: 'bg-[#FFF6E4] text-[#A76700]',
  viewed: 'bg-[#F1F4FA] text-[#4A5D86]',
  payment_reversed: 'bg-[#FDEAEA] text-[#C72D34]',
  voided: 'bg-muted text-muted-foreground',
}

export function InvoiceActivityCard({ invoice }: { invoice: Invoice }) {
  return <Card title="Activity">
    {invoice.activity.length === 0
      ? <p className="py-2 text-xs text-muted-foreground">No activity yet.</p>
      : <ol className="flex flex-col gap-4">
        {invoice.activity.map(entry => <li key={entry.id} className="flex items-start gap-3">
          <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full', ACTIVITY_TONE[entry.type] ?? 'bg-accent text-secondary')}>{ACTIVITY_ICON[entry.type]}</span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold">{entry.message}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{[dateTime(entry.at), entry.by].filter(Boolean).join(' · ')}</p>
          </div>
        </li>)}
      </ol>}
  </Card>
}
