import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { KitEmpty, KitMoneyField } from '@/components/ui/KitExtras'
import { KitField, KitSelect } from '@/components/ui/KitForm'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { OtpInput } from '@/components/ui/OtpInput'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReceiptModal } from '@/features/transactions/components/ReceiptModal'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { cn } from '@/lib/cn'
import { useTransferFlow, type TransferFlow } from '../hooks/useTransferFlow'

/**
 * sink-inventory's transfer, as a dialog: Transfer Funds (balance, recent recipient, bank, account
 * number with name enquiry, category, amount, narration) → Confirm Transfer (details, charges, PIN)
 * → the transfer receipt. Pays through the same wallet transfer as the Payments screen.
 */

const panel = 'flex max-h-[calc(100dvh-2rem)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl'

function CloseButton({ onClose, light }: { onClose: () => void; light?: boolean }) {
  return <button type="button" aria-label="Close" onClick={onClose} className={cn('rounded-lg p-2', light ? 'text-white/70 hover:bg-white/10' : 'text-muted-foreground hover:bg-muted')}><X size={17}/></button>
}

/** Which account the money leaves, number in full: an expense account's number is what staff look for. */
function FromAccount({ flow }: { flow: TransferFlow }) {
  if (!flow.fromAccount) return null
  const { name, bank, number, isExpense } = flow.fromAccount
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-[#F8FAF8] px-3 py-2.5">
    <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{isExpense ? 'Paying from expense account' : 'Paying from'}</p><p className="mt-0.5 truncate text-xs font-extrabold">{name}</p></div>
    <p className="shrink-0 text-right text-[11px] text-muted-foreground">{bank}<br/><b className="font-mono text-xs tracking-wider text-foreground">{number || '—'}</b></p>
  </div>
}

function ErrorNote({ children }: { children: ReactNode }) {
  return <p role="alert" className="rounded-lg bg-[#FDEAEA] px-3 py-2.5 text-[11px] font-bold text-[#C72D34]">{children}</p>
}

function TransferForm({ flow, onClose }: { flow: TransferFlow; onClose: () => void }) {
  const { symbol } = useBusinessCurrency()
  return <>
    <div className="shrink-0 bg-primary p-6 text-white">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-white/70">Available Balance</p>
        <span className="-mr-2 -mt-2"><CloseButton onClose={onClose} light/></span>
      </div>
      {flow.availableLoading ? <Skeleton className="mt-1 h-10 w-48 bg-white/10"/> : <p className="text-[32px] font-extrabold leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-4xl">{flow.available}</p>}
      <p className="mt-2 text-[11px] text-white/60">Your funds are ready to be transferred.</p>
    </div>
    <form className="min-h-0 flex-1 overflow-y-auto p-6" onSubmit={event => { event.preventDefault(); flow.next() }}>
      <ModalTitle className="text-xl font-extrabold">Transfer Funds</ModalTitle>
      <p className="mt-1 text-xs text-muted-foreground">Send money to another account securely.</p>
      <div className="mt-6 flex flex-col gap-5">
        {flow.recent.options.length > 0 && <KitSelect label="Recent recipient" placeholder="Search someone you've paid before..." options={flow.recent.options} value={flow.recent.value} onChange={event => flow.recent.applyKey(event.target.value)}/>}
        {flow.accounts.length > 1 && <KitSelect label="Pay from" value={flow.fromBankId} options={flow.accounts} onChange={event => flow.setFromBank(event.target.value)} error={flow.errors.fromBankId?.message}/>}
        <FromAccount flow={flow}/>
        <KitSelect label="Recipient Bank" placeholder={flow.bank.loading ? 'Loading banks…' : 'Search for a bank...'} options={flow.bank.options} value={flow.bank.value} onChange={event => flow.setBankCode(event.target.value)} error={flow.errors.bankCode?.message}/>
        <KitField label="Account Number" inputMode="numeric" placeholder="1234567890" value={flow.accountNumber} onChange={event => flow.setAccountNumber(event.target.value)} error={flow.errors.accountNumber?.message}/>
        <div>
          <KitSelect label="Category (Optional)" placeholder="Select a category..." options={[{ value: '', label: 'No category' }, ...flow.categories]} {...flow.register('categoryId')}/>
          <p className="mt-1.5 text-[10px] font-semibold text-[#A76700]">Attach an expense category (except for stock purchases)</p>
        </div>
        <div>
          <span className="mb-1.5 flex items-center justify-between text-[10px] font-extrabold">Account Name{flow.verifying && <Loader2 size={13} className="animate-spin text-secondary"/>}</span>
          <div className={cn('flex h-11 items-center gap-2 rounded-xl border px-3 text-xs font-bold', flow.beneficiary ? 'border-secondary/25 bg-accent text-secondary' : 'border-border bg-[#F1F4F1] text-muted-foreground')}>
            {flow.beneficiary && <CheckCircle2 size={14} className="shrink-0"/>}
            <span className="truncate">{flow.beneficiary?.name ?? (flow.enquiryFailed ? 'We couldn\'t verify this account' : 'Recipient Full Name')}</span>
          </div>
        </div>
        <KitMoneyField label={`Amount (${symbol})`} symbol={symbol} error={flow.errors.amount?.message} {...flow.register('amount')}/>
        <KitField label="Narration (Optional)" placeholder="e.g. Rent payment" {...flow.register('narration')}/>
        {flow.isExpenseAccount && <p className="flex gap-2 rounded-lg bg-[#F8FAF8] p-3 text-[10px] leading-4 text-muted-foreground"><ShieldCheck size={14} className="shrink-0 text-secondary"/>Paying from an expense account follows your approval rules: it may wait for an approver before funds move.</p>}
        {flow.error && <ErrorNote>{flow.error}</ErrorNote>}
        <KitButton type="submit" className="h-12 w-full text-sm">Transfer Now</KitButton>
      </div>
    </form>
  </>
}

function ConfirmRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'green' }) {
  return <div className="flex justify-between gap-4 text-xs">
    <span className={cn('shrink-0', strong ? 'font-extrabold text-foreground' : 'font-semibold text-foreground/75')}>{label}</span>
    <span className={cn('text-right [overflow-wrap:anywhere]', tone === 'green' ? 'font-extrabold text-secondary' : strong ? 'font-extrabold' : 'text-muted-foreground')}>{value}</span>
  </div>
}

function ConfirmTransfer({ flow, onClose }: { flow: TransferFlow; onClose: () => void }) {
  return <>
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-4">
      <button type="button" onClick={flow.back} disabled={flow.submitting} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground/75 hover:bg-muted"><ArrowLeft size={14}/> Back</button>
      <CloseButton onClose={onClose}/>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <ModalTitle className="text-xl font-extrabold">Confirm Transfer</ModalTitle>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Please verify the transaction details and enter your PIN to complete the transfer.</p>
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-[#F8FAF8] p-4">
        {flow.fromAccount && <ConfirmRow label="From:" value={`${flow.fromAccount.name} · ${flow.fromAccount.number}`}/>}
        <ConfirmRow label="Bank Name:" value={flow.bank.name}/>
        <ConfirmRow label="Account Number:" value={flow.accountNumber}/>
        <ConfirmRow label="Account Name:" value={flow.beneficiary?.name || 'N/A'}/>
        <ConfirmRow label="Amount:" value={flow.amount} tone="green"/>
        <ConfirmRow label="Charges:" value={flow.charges}/>
        {flow.stampDuty && <ConfirmRow label="Stamp Duty:" value={flow.stampDuty}/>}
        <div className="border-t border-border pt-3"><ConfirmRow label="Total:" value={flow.total} strong tone="green"/></div>
        {flow.categoryName && <ConfirmRow label="Category:" value={flow.categoryName}/>}
        {flow.narration && <div className="border-t border-border pt-3"><ConfirmRow label="Narration:" value={flow.narration}/></div>}
      </div>
      {flow.feesAreEstimate && <p className="mt-3 text-[11px] text-muted-foreground">The charges are an estimate and are confirmed when the payout runs.</p>}
      <p className="mt-6 text-xs font-semibold text-foreground/75">Enter 4-digit PIN</p>
      <div className="mx-auto max-w-[260px] [&>div]:mt-3 [&>div]:justify-center"><OtpInput value={flow.pin} onChange={flow.setPin} length={4}/></div>
      {flow.error && <div className="mt-4"><ErrorNote>{flow.error}</ErrorNote></div>}
      <div className="mt-6 flex flex-col gap-3">
        <KitButton onClick={flow.submit} loading={flow.submitting} disabled={flow.pin.length !== 4} className="h-12 w-full text-sm">{flow.submitting ? 'Processing...' : flow.isExpenseAccount ? 'Submit for approval' : 'Complete Transfer'}</KitButton>
        <KitButton variant="secondary" onClick={flow.back} disabled={flow.submitting} className="h-12 w-full text-sm">Cancel</KitButton>
      </div>
    </div>
  </>
}

function TransferDialog({ bankId, onClose }: { bankId?: string; onClose: () => void }) {
  const flow = useTransferFlow({ bankId })
  // After a direct transfer the receipt takes over; closing it finishes the flow.
  if (flow.receipt) return <ReceiptModal receipt={flow.receipt} onClose={() => { flow.closeReceipt(); onClose() }}/>

  let body: ReactNode
  if (!flow.canInitiate) body = <><div className="flex justify-end px-4 pt-4"><CloseButton onClose={onClose}/></div><KitEmpty icon={<ShieldCheck size={18}/>} title="You can't start transfers" note="Ask the business owner to give you the transfer permission." className="pb-8"/></>
  else if (flow.submittedForApproval) body = <div className="p-8 text-center">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-secondary"><CheckCircle2 size={22}/></span>
    <ModalTitle className="mt-4 text-lg font-extrabold">Submitted for approval</ModalTitle>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">Funds stay in the expense account until an approver releases the request.</p>
    <KitButton onClick={onClose} className="mt-6 h-12 w-full text-sm">Done</KitButton>
  </div>
  else body = flow.step === 1 ? <TransferForm flow={flow} onClose={onClose}/> : <ConfirmTransfer flow={flow} onClose={onClose}/>

  return <Modal open onClose={flow.submitting ? () => undefined : onClose} title={flow.canInitiate ? undefined : 'Transfer funds'} overlayClassName="bg-primary/40 p-4 backdrop-blur-sm" panelClassName={panel}>{body}</Modal>
}

/** Mounts the flow only while open, so its banks/beneficiaries load on demand and every open starts clean. Pass bankId to pay from a given account. */
export function TransferModal({ open, bankId, onClose }: { open: boolean; bankId?: string; onClose: () => void }) {
  return open ? <TransferDialog bankId={bankId} onClose={onClose}/> : null
}
