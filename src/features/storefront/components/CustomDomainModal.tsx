import { ArrowLeft, ArrowRight, Check, Clock, Copy, Globe } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { cn } from '@/lib/cn'
import { useCustomDomain } from '../hooks/useCustomDomain'

/** Two-step custom domain flow from sink-inventory: enter the domain, then add the CNAME and save. */
export function CustomDomainModal({ open, onClose, currentDomain }: { open: boolean; onClose: () => void; currentDomain: string }) {
  return <KitModal open={open} onClose={onClose} title="Connect a custom domain" icon={<Globe size={16}/>} panelClassName="max-w-lg" bodyClassName="p-0">
    {/* Keyed so each opening starts fresh at step 1. */}
    {open && <DomainFlow key={currentDomain} currentDomain={currentDomain} onClose={onClose}/>}
  </KitModal>
}

function DomainFlow({ currentDomain, onClose }: { currentDomain: string; onClose: () => void }) {
  const flow = useCustomDomain(currentDomain, onClose)

  return <div className="p-6">
    <p className="text-[11px] font-bold text-muted-foreground">{flow.step === 1 ? 'Step 1 of 2 · Enter the domain you own' : 'Step 2 of 2 · Point your domain to Sync360'}</p>
    <div className="mt-3 flex gap-2">{[1, 2].map(item => <span key={item} className={cn('h-1.5 flex-1 rounded-full', item <= flow.step ? 'bg-secondary' : 'bg-[#E3EAE6]')}/>)}</div>

    {flow.step === 1 ? <form className="mt-6" onSubmit={event => { event.preventDefault(); flow.continueToDns() }}>
      <KitField label="Your domain" placeholder="shop.yourbusiness.com" value={flow.input} onChange={event => flow.setInput(event.target.value)} error={flow.error} autoFocus/>
      <p className="mt-1.5 text-[10px] text-muted-foreground">Subdomains like shop. or store. work best.</p>
      <div className="mt-6 flex justify-end gap-2"><KitButton variant="secondary" onClick={onClose}>Cancel</KitButton><KitButton type="submit">Continue <ArrowRight size={14}/></KitButton></div>
    </form> : <div className="mt-6">
      <p className="text-xs leading-5 text-muted-foreground">In your domain provider’s DNS settings, add this record for <strong className="text-foreground">{flow.domain}</strong>:</p>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[64px_minmax(0,1fr)] border-b border-border bg-[#FAFBFA] px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-[.08em] text-muted-foreground sm:grid-cols-[72px_100px_minmax(0,1fr)]"><span>Type</span><span className="hidden sm:block">Host</span><span>Points to</span></div>
        <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center px-4 py-3 text-xs font-bold sm:grid-cols-[72px_100px_minmax(0,1fr)]">
          <span>CNAME</span>
          <span className="hidden truncate sm:block">{flow.hostLabel}</span>
          <span className="flex min-w-0 items-center justify-between gap-2"><span className="truncate">{flow.dnsTarget}</span><button type="button" onClick={flow.copyTarget} aria-label="Copy CNAME target" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-secondary hover:bg-accent">{flow.copied ? <Check size={15}/> : <Copy size={15}/>}</button></span>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F4F8F5] p-3 text-[10px] leading-4 text-muted-foreground"><Clock size={14} className="mt-0.5 shrink-0"/><span>DNS changes can take up to 48 hours. Your store keeps working on its Sync360 link until the domain is verified. If your provider doesn’t allow a CNAME on the root domain, use a subdomain instead.</span></div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><KitButton variant="secondary" onClick={flow.back}><ArrowLeft size={14}/> Back</KitButton><KitButton onClick={flow.submit} loading={flow.saving}><Check size={14}/> I’ve added the record</KitButton></div>
    </div>}
  </div>
}
