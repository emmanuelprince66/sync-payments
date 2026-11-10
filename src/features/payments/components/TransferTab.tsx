import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { KitEmpty, KitMoneyField } from '@/components/ui/KitExtras'
import { KitField, KitSelect } from '@/components/ui/KitForm'
import { OtpInput } from '@/components/ui/OtpInput'
import { KitButton } from '@/components/ui/PaymentKit'
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { ReceiptModal } from '@/features/transactions/components/ReceiptModal'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { TransferFlow } from '../hooks/useTransferFlow'

function Details({ flow }: { flow: TransferFlow }) {
  const { symbol } = useBusinessCurrency()
  return <div className="flex flex-col gap-5 p-6">
    <KitSelect label="Pay from" value={flow.fromBankId} onChange={event => flow.setFromBank(event.target.value)} error={flow.errors.fromBankId?.message} boxClassName="h-12">
      {flow.accounts.length === 0 && <option value="">{flow.accountsLoading ? 'Loading accounts…' : 'No accounts yet'}</option>}
      {flow.accounts.map(account => <option key={account.value} value={account.value}>{account.label}</option>)}
    </KitSelect>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
      <KitSelect label="Bank" value={flow.bank.value} onChange={event => flow.setBankCode(event.target.value)} error={flow.errors.bankCode?.message}>
        <option value="">{flow.bank.loading ? 'Loading banks…' : 'Select a bank'}</option>
        {flow.bank.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </KitSelect>
      <KitField label="Account number" inputMode="numeric" placeholder="10-digit account number" value={flow.accountNumber} onChange={event => flow.setAccountNumber(event.target.value)} error={flow.errors.accountNumber?.message}/>
    </div>
    <div>
      <span className="mb-1.5 block text-[10px] font-extrabold">Beneficiary</span>
      {flow.verifying
        ? <Skeleton className="h-11 w-full rounded-xl"/>
        : <div className={cn('flex h-11 items-center gap-2 rounded-xl border px-3 text-xs font-bold', flow.beneficiary ? 'border-secondary/25 bg-accent text-secondary' : 'border-border bg-[#F8FAF8] text-muted-foreground')}>
          {flow.beneficiary && <CheckCircle2 size={14} className="shrink-0"/>}
          <span className="truncate">{flow.beneficiary?.name ?? (flow.enquiryFailed ? 'We couldn\'t verify this account' : 'Verified automatically from the account number')}</span>
        </div>}
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
      <KitMoneyField label="Amount" symbol={symbol} error={flow.errors.amount?.message} {...flow.register('amount')}/>
      <KitSelect label="Category (optional)" {...flow.register('categoryId')}>
        <option value="">No category</option>
        {flow.categories.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </KitSelect>
    </div>
    <KitField label="Payment reference" placeholder="What is this payment for?" {...flow.register('narration')}/>
    <div className="rounded-lg bg-[#F8FAF8] p-4 text-[9px] leading-4 text-muted-foreground"><ShieldCheck size={14} className="mb-2 text-secondary"/>{flow.isExpenseAccount ? 'Paying from an expense account follows your approval rules: it may wait for an approver before funds move.' : 'The beneficiary is verified before you can continue, and every transfer needs your transaction PIN.'}</div>
    {flow.error && <p role="alert" className="rounded-lg bg-[#FDEAEA] px-3 py-2 text-[10px] font-bold text-[#C72D34]">{flow.error}</p>}
  </div>
}

function Review({ flow }: { flow: TransferFlow }) {
  const rows = [['From', flow.fromLabel], ['Reference', flow.narration || '—'], ...(flow.categoryName ? [['Category', flow.categoryName]] : []), ['Fee', flow.fee], ['Total', flow.total], ['Approval', flow.isExpenseAccount ? 'Per your approval rules' : 'Your transaction PIN']]
  return <div className="p-6">
    <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Review transfer</p>
    <p className="mt-3 text-3xl font-extrabold [overflow-wrap:anywhere]">{flow.amount}</p>
    <p className="mt-1 text-[10px] text-muted-foreground">To {flow.beneficiary?.name} · {flow.bank.name} •• {flow.accountNumber.slice(-4)}</p>
    <div className="mt-6 divide-y divide-border rounded-lg border border-border px-4">
      {rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 py-3 text-[10px]"><span className="shrink-0 text-muted-foreground">{label}</span><span className="text-right font-extrabold [overflow-wrap:anywhere]">{value}</span></div>)}
    </div>
    <p className="mt-6 text-center text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Enter transaction PIN</p>
    <div className="mx-auto max-w-[260px] [&>div]:mt-3"><OtpInput value={flow.pin} onChange={flow.setPin} length={4}/></div>
    {flow.error && <p role="alert" className="mt-4 rounded-lg bg-[#FDEAEA] px-3 py-2 text-[10px] font-bold text-[#C72D34]">{flow.error}</p>}
  </div>
}

/** The design's "Make a transfer" card and its side panel. */
export function TransferTab({ flow }: { flow: TransferFlow }) {
  if (!flow.canInitiate) return <section className="rounded-xl border border-border bg-white"><KitEmpty icon={<ShieldCheck size={18}/>} title="You can't start transfers" note="Ask the business owner to give you the transfer permission."/></section>
  return <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
    <section className="min-w-0 rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div className="min-w-0"><h2 className="text-sm font-extrabold">Make a transfer</h2><p className="mt-1 text-[9px] text-muted-foreground">Bank transfer to any account</p></div>
        <div className="flex shrink-0 items-center gap-2 text-[9px] font-extrabold text-muted-foreground"><span className="text-secondary">1 Details</span><i className="h-px w-6 bg-border"/><span className={flow.step >= 2 ? 'text-secondary' : ''}>2 Review</span></div>
      </div>
      {flow.step === 1 ? <Details flow={flow}/> : <Review flow={flow}/>}
      <div className="flex justify-between gap-2 border-t border-border px-6 py-4">
        <KitButton variant="secondary" disabled={flow.submitting} onClick={flow.step === 1 ? flow.cancel : flow.back}>{flow.step === 1 ? 'Cancel' : 'Back'}</KitButton>
        <KitButton onClick={flow.step === 1 ? flow.next : flow.submit} loading={flow.submitting} disabled={flow.step === 2 && flow.pin.length !== 4}>{flow.step === 1 ? 'Review transfer' : flow.isExpenseAccount ? 'Submit for approval' : `Send ${flow.amount}`} <ArrowRight size={14}/></KitButton>
      </div>
    </section>
    <aside className="flex min-w-0 flex-col gap-4">
      <div className="rounded-xl bg-primary p-5 text-white">
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/50">Available to transfer</p>
        {flow.availableLoading ? <Skeleton className="mt-2 h-9 w-44 bg-white/10"/> : <p className="mt-2 text-3xl font-extrabold [overflow-wrap:anywhere]">{flow.available}</p>}
        <p className="mt-1 truncate text-[9px] text-white/50">{flow.fromLabel}</p>
      </div>
      <div className="rounded-xl border border-border bg-white p-5">
        <h3 className="text-xs font-extrabold">Recent beneficiaries</h3>
        {flow.recent.loading
          ? <ListSkeleton rows={3} className="mt-2"/>
          : flow.recent.rows.length === 0
            ? <p className="mt-4 text-[10px] leading-4 text-muted-foreground">People you pay will show up here for quick repeat transfers.</p>
            : <div className="mt-4 flex flex-col gap-4">{flow.recent.rows.map(row => <button key={`${row.bankCode}-${row.accountNumber}`} type="button" onClick={() => flow.recent.apply(row)} className="flex w-full items-center text-left">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[9px] font-extrabold text-secondary">{initials(row.accountName || 'B')}</span>
              <span className="ml-3 min-w-0"><b className="block truncate text-[10px]">{row.accountName || 'Beneficiary'}</b><i className="mt-0.5 block truncate text-[8px] not-italic text-muted-foreground">{row.bankName} •• {row.accountNumber.slice(-4)}</i></span>
              <ArrowRight size={12} className="ml-auto shrink-0 text-muted-foreground"/>
            </button>)}</div>}
      </div>
    </aside>
    <ReceiptModal receipt={flow.receipt} onClose={flow.closeReceipt}/>
  </div>
}
