import { BadgeCheck, CreditCard, ShieldAlert, Store, Globe } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { BNPL_FEE_LABEL } from '../eligibility'
import { useBnplSetup } from '../hooks/useBnplSetup'
import { BnplTerms } from './BnplTerms'

/** Akawopay — Buy Now, Pay Later setup (sink-inventory's BnplCard + activation modal, via SyncShip). */
export function BnplCard({ active }: { active: boolean }) {
  const bnpl = useBnplSetup(active)
  const modal = bnpl.modal

  return <>
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-secondary"><CreditCard size={18}/></span>
        <div className={cn(bnpl.saving && 'pointer-events-none opacity-50')} aria-busy={bnpl.saving || undefined}><Toggle label="Akawopay — Buy Now, Pay Later" enabled={bnpl.active} onChange={bnpl.toggle}/></div>
      </div>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-xs font-extrabold">Akawopay — Buy Now, Pay Later</span>
        <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', bnpl.active ? 'bg-[#E8F5EA] text-[#337D44]' : 'bg-muted text-muted-foreground')}>{bnpl.active ? 'Active' : 'Off'}</span>
      </div>
      <p className="mb-3 text-[11px] leading-5 text-muted-foreground">Let customers Buy Now and Pay Later, in-store and online. Akawopay decides who qualifies and collects the repayments — you are settled within 24 hours.</p>

      {bnpl.checking
        ? <Skeleton className="mb-3 h-10 w-full rounded-xl"/>
        : !bnpl.ready && !bnpl.active && <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#F1D9A6] bg-[#FFF8E8] p-2.5">
          <ShieldAlert size={14} className="mt-0.5 shrink-0 text-[#A76700]"/>
          <p className="text-[11px] leading-5 text-[#6B5A35]">Upgrade your KYC verification to Tier {bnpl.minTier} to unlock Buy Now Pay Later for your customers. <button type="button" onClick={bnpl.goToVerification} className="font-extrabold text-secondary hover:underline">Verify now</button></p>
        </div>}

      <button type="button" onClick={bnpl.learnMore} className="text-[11px] font-extrabold text-secondary hover:underline">Learn more</button>
    </div>

    <KitModal
      open={modal.open}
      onClose={modal.close}
      title="Activate BNPL with Akawopay"
      icon={<CreditCard size={16}/>}
      panelClassName="max-w-lg"
      footer={bnpl.ready ? <>
        <KitButton variant="secondary" onClick={modal.close} disabled={bnpl.saving} className="flex-1">Cancel</KitButton>
        <KitButton onClick={modal.activate} disabled={!modal.agreed || bnpl.active} loading={bnpl.saving} className="flex-1">{bnpl.active ? 'Already active' : 'Activate BNPL'}</KitButton>
      </> : undefined}
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-2 text-xs leading-5 text-muted-foreground">
          <p>Offer your customers the flexibility to Buy Now and Pay Later, both in-store and online.</p>
          <p>With Sync360, you can connect your business to Akawopay and offer BNPL to eligible customers.</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2 rounded-xl bg-[#F4F8F5] p-3"><Store size={14} className="mt-0.5 shrink-0 text-muted-foreground"/><p className="text-[11px] leading-5 text-foreground/75"><span className="font-extrabold text-foreground">In-store:</span> Customers can choose BNPL when purchasing directly from your business.</p></div>
          <div className="flex items-start gap-2 rounded-xl bg-[#F4F8F5] p-3"><Globe size={14} className="mt-0.5 shrink-0 text-muted-foreground"/><p className="text-[11px] leading-5 text-foreground/75"><span className="font-extrabold text-foreground">Online:</span> Customers can access BNPL when purchasing through your online store.</p></div>
        </div>
        <p className="rounded-xl border border-[#BFD9C3] bg-[#EEF8EC] p-3 text-xs font-extrabold">{BNPL_FEE_LABEL}</p>

        {!bnpl.ready
          ? <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-[#F1D9A6] bg-[#FFF8E8] p-4">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[#A76700]"/>
              <div><p className="text-xs font-extrabold">Verification required</p><p className="mt-1 text-[11px] leading-5 text-[#6B5A35]">{bnpl.reason}</p></div>
            </div>
            <KitButton onClick={bnpl.goToVerification} className="w-full py-3">Go to verification</KitButton>
          </div>
          : <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#BFD9C3] bg-[#EEF8EC] p-3 text-[11px] font-bold text-[#337D44]"><BadgeCheck size={15}/>Your account is verified — you can activate BNPL.</div>
            <div>
              <h3 className="mb-2 text-xs font-extrabold">BNPL Merchant Terms &amp; Conditions</h3>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-[#F8FAF8] p-3"><BnplTerms/></div>
            </div>
            {!bnpl.active && <label className="flex cursor-pointer items-start gap-2.5">
              <input type="checkbox" checked={modal.agreed} onChange={event => modal.setAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#529661]"/>
              <span className="text-[11px] leading-5 text-foreground/75">I have read and agree to the BNPL Merchant Terms &amp; Conditions.</span>
            </label>}
            {modal.apiError && <p role="alert" className="text-[11px] font-extrabold text-[#C72D34]">{modal.apiError}</p>}
          </div>}
      </div>
    </KitModal>
  </>
}
