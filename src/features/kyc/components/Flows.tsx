import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import type { Kyc } from '../hooks/useKyc'
import { useCorporateFlow, useIndividualFlow } from '../hooks/useTierFlows'
import { CORPORATE_TIERS, INDIVIDUAL_TIERS } from '../tiers'
import { CorporateTier1Form, CorporateTier2Form } from './CorporateForms'
import { Tier1Form, Tier2Form, Tier3Form } from './IndividualForms'
import { LimitChip, Notice, TierPanel } from './KycUi'
import { AccountStatusCard, TierRail, UpgradeToCorporateCard } from './Sidebar'

function FormSkeleton() {
  return <SkeletonGroup label="Loading verification" className="flex flex-col gap-4 py-2">
    <Skeleton className="h-3 w-32"/>
    <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-12 rounded-xl"/><Skeleton className="h-12 rounded-xl"/></div>
    <Skeleton className="h-12 rounded-xl"/>
    <Skeleton className="h-20 rounded-2xl"/>
    <Skeleton className="h-12 rounded-xl"/>
  </SkeletonGroup>
}

function ContinueButton({ tier, onClick }: { tier: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-extrabold text-secondary shadow-sm transition-colors hover:bg-[#F4FAF5]">
    Continue to Tier {tier} <Icon name="arrow" size={13}/>
  </button>
}

/** Individual account: three tiers, one identifier at a time (sink's IndividualTierFlow). */
export function IndividualFlow({ kyc, onUpgradeToCorporate }: { kyc: Kyc; onUpgradeToCorporate: () => void }) {
  const flow = useIndividualFlow(kyc)
  const { verification } = kyc
  const { currentTier } = flow

  return <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
    <aside className="flex flex-col gap-4 lg:sticky lg:top-[92px] lg:self-start">
      <AccountStatusCard verification={verification}/>
      <TierRail tiers={INDIVIDUAL_TIERS} currentTier={currentTier} completedTiers={flow.completedTiers} canAccessTier={flow.canAccessTier} onSelect={flow.selectTier}/>
      <UpgradeToCorporateCard onUpgrade={onUpgradeToCorporate}/>
    </aside>

    <div className="min-w-0 flex flex-col gap-5">
      {flow.notice && <Notice tone="success" title={flow.notice.title}>
        <div className="flex flex-wrap items-center gap-3"><span>{flow.notice.body}</span>{flow.notice.next && <ContinueButton tier={flow.notice.next} onClick={() => flow.selectTier(flow.notice?.next ?? currentTier)}/>}</div>
      </Notice>}

      <TierPanel tier={currentTier} title={flow.tierMeta.title} description={flow.tierMeta.description} aside={<LimitChip limit={flow.tierMeta.limit}/>}>
        {verification.isLoading
          ? <FormSkeleton/>
          : flow.completedTiers.includes(currentTier)
            ? <Notice tone="success" title="Already verified">This tier is complete. Pick the next one from the progress list to carry on.</Notice>
            : !flow.canAccessTier(currentTier)
              ? <Notice tone="locked" title="Locked">Complete Tier {currentTier - 1} before starting Tier {currentTier}.</Notice>
              : currentTier === 1
                ? <Tier1Form kyc={kyc} onSubmit={() => flow.submit(1)}/>
                : currentTier === 2
                  ? <Tier2Form kyc={kyc} onSubmit={() => flow.submit(2)}/>
                  : <Tier3Form kyc={kyc} onSubmit={mode => flow.submit(3, mode)}/>}
      </TierPanel>
    </div>
  </div>
}

/** Corporate account: business details, then CAC documents and directors (sink's CorporateAcct). */
export function CorporateFlow({ kyc }: { kyc: Kyc }) {
  const flow = useCorporateFlow(kyc)
  const { verification } = kyc
  const { currentTier } = flow

  return <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
    <aside className="flex flex-col gap-4 lg:sticky lg:top-[92px] lg:self-start">
      <AccountStatusCard verification={verification}/>
      <TierRail tiers={CORPORATE_TIERS} currentTier={currentTier} completedTiers={flow.completedTiers} canAccessTier={flow.canAccessTier} onSelect={flow.selectTier}/>
    </aside>

    <div className="min-w-0 flex flex-col gap-5">
      {flow.notice && <Notice tone={flow.notice.tone} title={flow.notice.title}>
        <div className="flex flex-wrap items-center gap-3"><span>{flow.notice.body}</span>{flow.notice.next && <ContinueButton tier={flow.notice.next} onClick={() => flow.selectTier(2)}/>}</div>
      </Notice>}

      <TierPanel tier={currentTier} title={flow.tierMeta.title} description={flow.tierMeta.description} aside={<LimitChip limit={flow.tierMeta.limit}/>}>
        {verification.isLoading
          ? <FormSkeleton/>
          : currentTier === 2 && flow.awaitingReview
            ? <Notice tone="info" title="Documents are with our review team">{flow.reviewSummary}. Nothing further is needed from you — we will email you as soon as they clear. Your Tier 1 limit stays in place until then.</Notice>
            : currentTier === 2 && flow.isRejected
              ? <>
                <Notice tone="warning" title="Your documents were sent back" className="mb-5">Something in the last submission could not be accepted. Check your email for what needs changing, then file again below.</Notice>
                <CorporateTier2Form kyc={kyc} onSubmit={() => flow.submit(2)}/>
              </>
              : flow.completedTiers.includes(currentTier)
                ? <Notice tone="success" title="Already verified">This tier is complete. Pick the next one from the progress list to carry on.</Notice>
                : !flow.canAccessTier(currentTier)
                  ? <Notice tone="locked" title="Locked">Complete Tier 1 before starting Tier 2.</Notice>
                  : currentTier === 1
                    ? <CorporateTier1Form kyc={kyc} onSubmit={() => flow.submit(1)}/>
                    : <CorporateTier2Form kyc={kyc} onSubmit={() => flow.submit(2)}/>}
      </TierPanel>
    </div>
  </div>
}
