import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { Verification } from '../hooks/useKyc'
import type { KycTier } from '../tiers'

function Flag({ label, on }: { label: string; on: boolean }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold', on ? 'bg-accent text-secondary' : 'bg-muted text-muted-foreground')}>
    <Icon name={on ? 'check' : 'close'} size={11} stroke={3}/>{label}
  </span>
}

/**
 * The account this verification belongs to, as the wallet endpoint reports it.
 * Renders nothing until an account has been opened (sink's AccountStatusCard).
 */
export function AccountStatusCard({ verification }: { verification: Verification }) {
  if (verification.isLoading) {
    return <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4" aria-hidden="true">
      <Skeleton className="h-3 w-24"/><Skeleton className="h-5 w-40"/><Skeleton className="h-8 w-full"/>
    </div>
  }
  const wallet = verification.wallet
  if (!wallet) return null

  return <div className="rounded-2xl border border-border bg-white p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="text-[10px] font-extrabold uppercase tracking-[.08em] text-muted-foreground">{verification.accountType === 'corporate' ? 'Corporate account' : 'Settlement account'}</p>
      {verification.tierLabel && <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">{verification.tierLabel}</span>}
    </div>
    <p className="mt-2 truncate text-sm font-extrabold text-foreground">{wallet.account_name}</p>
    <p className="text-[11px] text-muted-foreground">{wallet.account_number}{wallet.bank_name ? ` · ${wallet.bank_name}` : ''}</p>
    {verification.verificationStatus && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FFF4D9] px-2 py-1 text-[10px] font-extrabold text-[#A16A15]">{verification.verificationStatus}</p>}
    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
      <Flag label="NIN" on={verification.hasNin}/>
      <Flag label="BVN" on={verification.hasBvn}/>
      <Flag label="Address" on={verification.hasAddress}/>
    </div>
  </div>
}

/** The verification ladder shared by both flows: beside the form on desktop, above it on mobile. */
export function TierRail({ tiers, currentTier, completedTiers, canAccessTier, onSelect }: { tiers: KycTier[]; currentTier: number; completedTiers: number[]; canAccessTier: (tier: number) => boolean; onSelect: (tier: number) => void }) {
  return <div className="rounded-2xl border border-border bg-[#F4FAF5] p-4">
    <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-[.1em] text-foreground">Verification progress</h2>
    <ol className="flex flex-col gap-2">
      {tiers.map((tier, index) => {
        const done = completedTiers.includes(tier.tier)
        const active = currentTier === tier.tier
        const unlocked = canAccessTier(tier.tier)
        return <li key={tier.tier} className="relative">
          {index < tiers.length - 1 && <span aria-hidden="true" className={cn('absolute left-[26px] top-[46px] h-[calc(100%-30px)] w-px', done ? 'bg-secondary' : 'bg-border')}/>}
          <button
            type="button"
            disabled={!unlocked}
            aria-current={active ? 'step' : undefined}
            onClick={() => unlocked && onSelect(tier.tier)}
            className={cn('relative flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
              active ? 'border-secondary bg-white shadow-sm' : done ? 'border-secondary/25 bg-accent hover:bg-accent' : unlocked ? 'border-border bg-white/70 hover:border-secondary/30' : 'cursor-not-allowed border-border bg-muted/60')}
          >
            <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold', done ? 'bg-secondary text-white' : active ? 'bg-accent text-secondary ring-2 ring-secondary' : 'bg-muted text-muted-foreground')}>
              {done ? <Icon name="check" size={13} stroke={3}/> : tier.tier}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className={cn('text-xs font-extrabold', unlocked ? 'text-foreground' : 'text-muted-foreground')}>Tier {tier.tier}</span>
                {done && <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase text-secondary">Verified</span>}
                {!unlocked && <span className="text-[9px] font-extrabold uppercase text-muted-foreground">Locked</span>}
              </span>
              <span className={cn('mt-0.5 block text-[11px] font-bold', unlocked ? 'text-foreground' : 'text-muted-foreground')}>{tier.title}</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">{tier.limit} daily · {tier.requirement}</span>
            </span>
          </button>
        </li>
      })}
    </ol>
  </div>
}

/** The way out of the individual flow for a merchant who has since registered a company. */
export function UpgradeToCorporateCard({ onUpgrade }: { onUpgrade: () => void }) {
  return <div className="rounded-2xl border border-dashed border-secondary/30 bg-white p-4">
    <div className="flex items-start gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon name="building" size={15}/></span>
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-foreground">Registered a business?</p>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">Move to a corporate account for higher limits and settlements in the company's name.</p>
      </div>
    </div>
    <button type="button" onClick={onUpgrade} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-white text-xs font-extrabold text-foreground transition-colors hover:border-secondary">
      Upgrade to corporate <Icon name="arrow" size={14}/>
    </button>
  </div>
}
