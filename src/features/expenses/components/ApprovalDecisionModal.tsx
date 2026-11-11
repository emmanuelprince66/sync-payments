import { ArrowLeft, Check, KeyRound, X } from 'lucide-react'
import { KitTextarea } from '@/components/ui/KitExtras'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { OtpInput } from '@/components/ui/OtpInput'
import { KitButton } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { isPending, transferStatus } from '../approval-items'
import type { ApprovalDecision } from '../hooks/useApprovalDecision'

const rejectClass = 'rounded-xl border border-[#EC1B24]/30 px-4 py-3 text-xs font-extrabold text-[#C72D34] hover:bg-[#FDEAEA] disabled:opacity-50'

/**
 * One request and the decision on it (sink: TransferDetailsModal, TransactionPinDialog, RejectTransferDialog).
 * Approve and Reject key off can_current_user_approve alone: the backend works it out per user.
 */
export function ApprovalDecisionModal({ decision }: { decision: ApprovalDecision }) {
  const money = useFormatMoney()
  const item = decision.selected
  const isPayout = item?.kind === 'transfer'
  const status = item ? transferStatus(item.status) : null

  return <Modal open={Boolean(item)} onClose={decision.close} overlayClassName="bg-primary/40 p-4 backdrop-blur-sm" panelClassName="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl">
    {item && status && <>
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          {decision.mode !== 'review'
            ? <button type="button" onClick={decision.back} className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary"><ArrowLeft size={13}/> Back to request</button>
            : <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{isPayout ? 'Transfer request' : 'Logged expense'}</p>}
          <ModalTitle className="mt-2 text-lg font-extrabold [overflow-wrap:anywhere]">{decision.mode === 'approve' ? (isPayout ? 'Approve and send' : 'Approve expense') : decision.mode === 'reject' ? `Reject this ${isPayout ? 'transfer' : 'expense'}` : item.title}</ModalTitle>
          <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{item.reference} · {item.requester}</p>
        </div>
        <button type="button" aria-label="Close" onClick={decision.close} className="h-9 shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={17}/></button>
      </div>

      <div className="my-5 rounded-2xl bg-[#F8FAF8] p-5 text-center">
        <p className="text-[10px] text-muted-foreground">Amount requested</p>
        <p className="mt-2 text-3xl font-extrabold [overflow-wrap:anywhere]">{money(item.amount)}</p>
        {/* The wallet is debited for amount + charges, so the approver sees the real cost. */}
        {item.charges > 0 && <p className="mt-2 text-[10px] text-muted-foreground">{money(item.charges)} bank charge · <b className="text-foreground">{money(item.amount + item.charges)}</b> leaves the wallet</p>}
      </div>

      {decision.mode === 'review' && <>
        <div className={cn('mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[10px]', status.className)}>
          <span className="font-extrabold">{status.label}</span>{status.hint && <span className="opacity-80">· {status.hint}</span>}
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          {item.details.map(([label, value]) => <div key={label} className="flex justify-between gap-3 text-xs"><span className="shrink-0 text-muted-foreground">{label}</span><span className="text-right font-extrabold [overflow-wrap:anywhere]">{value}</span></div>)}
        </div>
        {item.decision && <div className={cn('mt-4 rounded-xl p-4 text-xs', item.decision.outcome === 'rejected' ? 'bg-[#FDEAEA] text-[#7A1F24]' : 'bg-accent text-primary')}>
          <p className="font-extrabold">{item.decision.outcome === 'rejected' ? 'Rejected' : 'Approved'} by {item.decision.by}{item.decision.at ? ` · ${item.decision.at}` : ''}</p>
          {item.decision.reason && <p className="mt-1 [overflow-wrap:anywhere]">“{item.decision.reason}”</p>}
        </div>}
        {item.canDecide
          ? <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={decision.startReject} className={rejectClass}>Reject</button>
            <KitButton onClick={decision.startApprove}><Check size={14}/> Approve</KitButton>
          </div>
          : isPending(item.status) && item.blockReason && <p className="mt-4 rounded-lg bg-[#FFF9EC] p-3 text-center text-[10px] font-bold text-[#A76700]">{item.blockReason}</p>}
        <p className="mt-4 text-center text-[9px] leading-4 text-muted-foreground">{isPayout ? 'Approving pays the beneficiary straight away. This cannot be undone.' : 'Approving signs this off in your books. Nothing is paid out.'}</p>
      </>}

      {decision.mode === 'approve' && <>
        <p className="text-center text-[11px] text-muted-foreground">{isPayout ? `${item.title} will be paid. This cannot be undone.` : 'Enter your transaction PIN to sign this expense off.'}</p>
        <p className="mt-4 text-center text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Transaction PIN</p>
        <div className="mx-auto max-w-[260px] [&>div]:mt-3"><OtpInput value={decision.pin} onChange={decision.setPin} length={4}/></div>
        {decision.error && <div role="alert" className="mt-4 rounded-lg bg-[#FDEAEA] px-3 py-2 text-[10px] font-bold text-[#C72D34]">
          {decision.error}
          {decision.needsPin && <button type="button" onClick={decision.createPin} className="mt-2 flex items-center gap-1 font-extrabold text-primary underline"><KeyRound size={12}/> Create my PIN</button>}
        </div>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <KitButton variant="secondary" onClick={decision.back}>Back</KitButton>
          <KitButton onClick={decision.approve} loading={decision.submitting} disabled={decision.pin.length !== 4}><Check size={14}/> {isPayout ? 'Approve & send' : 'Approve'}</KitButton>
        </div>
      </>}

      {decision.mode === 'reject' && <>
        <p className="mb-4 text-[11px] text-muted-foreground">{isPayout ? `Request ${item.reference} will not be sent.` : `Expense ${item.reference} will be marked rejected.`} The reason is what {item.requester} sees.</p>
        <KitTextarea label="Reason" placeholder="e.g. Invoice price is higher than the agreed quote." value={decision.reason} onChange={event => decision.setReason(event.target.value)} error={decision.error}/>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <KitButton variant="secondary" onClick={decision.back}>Back</KitButton>
          <button type="button" disabled={decision.submitting} onClick={decision.reject} className={rejectClass}>{decision.submitting ? 'Rejecting…' : 'Reject'}</button>
        </div>
      </>}
    </>}
  </Modal>
}
