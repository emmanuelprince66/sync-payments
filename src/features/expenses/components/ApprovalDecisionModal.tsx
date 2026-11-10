import { Check, X } from 'lucide-react'
import { KitTextarea } from '@/components/ui/KitExtras'
import { SampleDataBadge } from '@/components/ui/misc'
import { Modal, ModalTitle } from '@/components/ui/Modal'
import { OtpInput } from '@/components/ui/OtpInput'
import { KitButton } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import type { ApprovalDecision } from '../hooks/useApprovalDecision'

/** The design's approval dialog, plus the PIN and rejection-reason steps the API requires. */
export function ApprovalDecisionModal({ decision }: { decision: ApprovalDecision }) {
  const money = useFormatMoney()
  const item = decision.selected
  const isPayout = item?.kind === 'transfer'

  return <Modal open={Boolean(item)} onClose={decision.close} overlayClassName="bg-primary/40 p-4 backdrop-blur-sm" panelClassName="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl">
    {item && <>
      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#A76700]">{item.canDecide ? 'Approval required' : item.status}</p>{item.kind === 'sample' && <SampleDataBadge/>}</div>
          <ModalTitle className="mt-2 text-lg font-extrabold [overflow-wrap:anywhere]">{item.title}</ModalTitle>
          <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{item.reference} · submitted by {item.requester}</p>
        </div>
        <button type="button" aria-label="Close" onClick={decision.close} className="h-9 shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={17}/></button>
      </div>
      <div className="my-6 rounded-2xl bg-[#F8FAF8] p-5 text-center">
        <p className="text-[10px] text-muted-foreground">Amount requested</p>
        <p className="mt-2 text-3xl font-extrabold [overflow-wrap:anywhere]">{money(item.amount)}</p>
      </div>

      {decision.mode === 'review' && <>
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          {[['Category', item.category], ['Submitted', item.submitted], ['Source', item.source], ...item.details, ...(item.note ? [['Note', item.note]] : [])].map(([label, value]) => <div key={label} className="flex justify-between gap-3 text-xs"><span className="shrink-0 text-muted-foreground">{label}</span><span className="text-right font-extrabold [overflow-wrap:anywhere]">{value}</span></div>)}
        </div>
        {item.canDecide
          ? <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={decision.startReject} className="rounded-xl border border-[#EC1B24]/30 px-4 py-3 text-xs font-extrabold text-[#C72D34] hover:bg-[#FDEAEA]">Reject</button>
            <KitButton onClick={decision.startApprove}><Check size={14}/> {isPayout ? 'Approve payment' : 'Approve'}</KitButton>
          </div>
          : item.blockReason && <p className="mt-4 rounded-lg bg-[#FFF9EC] p-3 text-center text-[10px] font-bold text-[#A76700]">{item.blockReason}</p>}
        <p className="mt-4 text-center text-[9px] leading-4 text-muted-foreground">{isPayout ? 'Approving authorizes Sync360 to move these funds. This action is recorded in the audit log.' : 'Approving signs this off in your books. Nothing is paid out, and the action is recorded in the audit log.'}</p>
      </>}

      {decision.mode === 'approve' && <>
        <p className="text-center text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Enter your transaction PIN</p>
        <div className="mx-auto max-w-[260px] [&>div]:mt-3"><OtpInput value={decision.pin} onChange={decision.setPin} length={4}/></div>
        {decision.error && <p role="alert" className="mt-4 rounded-lg bg-[#FDEAEA] px-3 py-2 text-[10px] font-bold text-[#C72D34]">{decision.error}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <KitButton variant="secondary" onClick={decision.back}>Back</KitButton>
          <KitButton onClick={decision.approve} loading={decision.submitting} disabled={decision.pin.length !== 4}><Check size={14}/> Confirm</KitButton>
        </div>
      </>}

      {decision.mode === 'reject' && <>
        <KitTextarea label="Reason for rejecting" placeholder="What should the requester change?" value={decision.reason} onChange={event => decision.setReason(event.target.value)} error={decision.error}/>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <KitButton variant="secondary" onClick={decision.back}>Back</KitButton>
          <button type="button" disabled={decision.submitting} onClick={decision.reject} className="rounded-xl border border-[#EC1B24]/30 px-4 py-3 text-xs font-extrabold text-[#C72D34] hover:bg-[#FDEAEA] disabled:opacity-50">{decision.submitting ? 'Rejecting…' : 'Reject request'}</button>
        </div>
      </>}
    </>}
  </Modal>
}
