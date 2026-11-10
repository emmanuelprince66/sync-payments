import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/** The panel every tier form sits in (sink's TierPanel). */
export function TierPanel({ tier, title, description, aside, children }: { tier: number; title: string; description: string; aside?: ReactNode; children: ReactNode }) {
  return <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-secondary"><Icon name="shield" size={20}/></span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-secondary">Tier {tier}</p>
          <h2 className="text-base font-extrabold text-foreground sm:text-lg">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {aside}
    </header>
    <div className="pt-5">{children}</div>
  </section>
}

export function LimitChip({ limit }: { limit: string }) {
  return <span className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-extrabold text-secondary">Unlocks {limit} daily</span>
}

const NOTICE_TONES: Record<'info' | 'warning' | 'success' | 'locked', { wrap: string; icon: string; title: string; Icon: IconName }> = {
  info: { wrap: 'border-[#D6E3F7] bg-[#F1F6FD]', icon: 'text-[#426AB2]', title: 'text-[#2F518F]', Icon: 'help' },
  warning: { wrap: 'border-[#F2DFB0] bg-[#FFF8E8]', icon: 'text-[#A16A15]', title: 'text-[#8D5A10]', Icon: 'bell' },
  success: { wrap: 'border-secondary/25 bg-accent', icon: 'text-secondary', title: 'text-secondary', Icon: 'shield' },
  locked: { wrap: 'border-border bg-muted', icon: 'text-muted-foreground', title: 'text-muted-foreground', Icon: 'shield' },
}

export function Notice({ tone = 'info', title, children, className }: { tone?: keyof typeof NOTICE_TONES; title?: string; children: ReactNode; className?: string }) {
  const style = NOTICE_TONES[tone]
  return <div className={cn('flex gap-3 rounded-2xl border p-4', style.wrap, className)}>
    <span className={cn('mt-0.5 shrink-0', style.icon)}><Icon name={style.Icon} size={17}/></span>
    <div className="min-w-0 text-xs leading-5">
      {title && <p className={cn('mb-0.5 text-[13px] font-extrabold', style.title)}>{title}</p>}
      <div className="text-muted-foreground">{children}</div>
    </div>
  </div>
}

export function SectionHeading({ title, description, meta }: { title: string; description?: string; meta?: string }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-2">
    <div>
      <h3 className="text-[11px] font-extrabold uppercase tracking-[.1em] text-foreground">{title}</h3>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
    {meta && <span className="text-[11px] font-extrabold text-secondary">{meta}</span>}
  </div>
}

/** Read-only recap of what the earlier tiers captured. */
export function CapturedSummary({ items }: { items: { label: string; value: string }[] }) {
  return <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-2xl border border-secondary/25 bg-[#F4FAF5] p-4">
    {items.map(item => <div key={item.label}>
      <p className="text-[10px] font-extrabold uppercase tracking-[.08em] text-muted-foreground">{item.label}</p>
      <p className="text-sm font-bold text-foreground">{item.value}</p>
    </div>)}
  </div>
}

/** Primary submit button at the foot of a tier form. */
export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return <KitButton type="submit" loading={pending} className="h-12 w-full text-sm">{pending ? 'Submitting…' : children}</KitButton>
}

/** 11-digit NIN/BVN input: digits only, max 11. Pass `form.register(name)`. */
export function DigitsField({ registration, label, placeholder, error }: { registration: UseFormRegisterReturn; label: string; placeholder: string; error?: string }) {
  return <KitField
    label={label}
    inputMode="numeric"
    maxLength={11}
    placeholder={placeholder}
    error={error}
    {...registration}
    onChange={event => {
      event.target.value = event.target.value.replace(/\D/g, '')
      registration.onChange(event)
    }}
  />
}
