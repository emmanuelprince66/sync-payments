import type { ReactNode } from 'react'
import { KitButton } from '@/components/ui/PaymentKit'
import { cn } from '@/lib/cn'

/** One storefront settings group, in the Payments card style. */
export function SettingsCard({ icon, title, description, action, children, className }: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return <section className={cn('min-w-0 rounded-xl border border-border bg-white p-4 sm:p-5', className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-secondary">{icon}</span>
        <div className="min-w-0"><h2 className="text-sm font-extrabold text-foreground">{title}</h2><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{description}</p></div>
      </div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </section>
}

/** Discard / Save row that appears under a card; enabled once it has unsaved changes. */
export function CardActions({ dirty, saving, onReset, onSave, saveLabel = 'Save changes', type = 'button' }: {
  dirty: boolean
  saving: boolean
  onReset: () => void
  onSave?: () => void
  saveLabel?: string
  type?: 'button' | 'submit'
}) {
  return <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
    {dirty && <span className="text-[10px] font-bold text-[#A76700] sm:mr-auto">You have unsaved changes</span>}
    <KitButton variant="ghost" onClick={onReset} disabled={!dirty || saving}>Discard</KitButton>
    <KitButton type={type} onClick={onSave} loading={saving} disabled={!dirty}>{saveLabel}</KitButton>
  </div>
}

/** Two-option pill switch (store channel, opening-day presets). */
export function PillSwitch<T extends string>({ value, options, onChange, label }: { value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void; label: string }) {
  return <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-[#EEF3EF] p-1 sm:inline-grid">
    {options.map(option => <button key={option.value} type="button" role="radio" aria-checked={value === option.value} onClick={() => onChange(option.value)} className={cn('rounded-lg px-4 py-2 text-[11px] font-extrabold transition', value === option.value ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{option.label}</button>)}
  </div>
}
