import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Icon } from '@/components/ui/Icon'
import { KitPage } from '@/components/ui/KitPage'
import { BackLink } from '@/components/ui/misc'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { CorporateFlow, IndividualFlow } from './components/Flows'
import { Notice } from './components/KycUi'
import { ACCOUNT_TYPES, useKycPage } from './hooks/useKycPage'

/**
 * Identity verification: a full page rather than a modal (sink-inventory's
 * KycConfirm). Corporate Tier 2 alone runs to seven company documents plus two
 * uploads per director, and a page keeps a half-finished verification safe
 * from a stray click outside.
 */
export default function KycPage() {
  const page = useKycPage()

  return <KitPage className="mx-auto w-full max-w-6xl">
    <header>
      {page.canChangeType ? <BackLink label="Change account type" onClick={page.backToChooser}/>
        : page.isUpgrading ? <BackLink label="Back to my individual verification" onClick={page.backToChooser}/>
        : <BackLink label="Back" onClick={page.exit}/>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-foreground">{page.headline}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{page.subhead}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-[10px] font-extrabold text-secondary"><ShieldCheck size={13}/> Encrypted &amp; verified by licensed providers</span>
      </div>
    </header>

    {page.isUpgrading && <Notice tone="info" title="This starts a new corporate verification">
      You will need your CAC documents, TIN and a record for every director. Nothing here changes the individual account you already verified.
    </Notice>}

    {page.loading
      ? <SkeletonGroup label="Loading verification" className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64 rounded-2xl"/><Skeleton className="h-64 rounded-2xl"/></SkeletonGroup>
      : page.chosen
        ? page.chosen.value === 'individual'
          ? <IndividualFlow kyc={page.kyc} onUpgradeToCorporate={page.upgradeToCorporate}/>
          : <CorporateFlow kyc={page.kyc}/>
        : <div className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            {ACCOUNT_TYPES.map(type => {
              const active = page.selection === type.value
              return <button key={type.value} type="button" aria-pressed={active} onClick={() => page.setSelection(type.value)} className={cn('min-w-0 rounded-2xl border-2 bg-white p-5 text-left transition', active ? 'border-secondary shadow-[0_8px_24px_rgba(29,38,28,.06)]' : 'border-border hover:border-secondary/30')}>
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-start gap-3">
                    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', active ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground')}><Icon name={type.icon} size={20}/></span>
                    <span className="min-w-0"><span className="block text-sm font-extrabold text-foreground">{type.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{type.blurb}</span></span>
                  </span>
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-secondary bg-secondary text-white' : 'border-secondary/30')}>{active && <Icon name="check" size={11} stroke={3}/>}</span>
                </span>
                <span className="mt-4 flex flex-col gap-2.5 border-t border-border pt-4">
                  {type.tiers.map(tier => <span key={tier.tier} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0 text-secondary"><Icon name="shield" size={14}/></span>
                    <span className="min-w-0"><span className="block text-xs font-extrabold text-foreground">Tier {tier.tier} · {tier.limit} daily</span><span className="block text-[11px] text-muted-foreground">{tier.requirement}</span></span>
                  </span>)}
                </span>
              </button>
            })}
          </div>
          <div className="flex flex-col items-center gap-3">
            <KitButton onClick={page.confirmSelection} className="h-12 w-full text-sm sm:w-auto sm:min-w-64">Continue <ArrowRight size={16}/></KitButton>
            <p className="text-[11px] text-muted-foreground">You can upgrade your tier at any time after verification.</p>
          </div>
        </div>}
  </KitPage>
}
