import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Small building blocks copied class-for-class from the Payments design. */

export type KitButtonVariant = 'primary' | 'secondary' | 'ghost'

const buttonVariants: Record<KitButtonVariant, string> = {
  primary: 'bg-secondary text-white hover:bg-[#438351] shadow-[0_5px_14px_rgba(82,150,97,.18)]',
  secondary: 'border border-border bg-white text-foreground hover:bg-muted',
  ghost: 'text-secondary hover:bg-accent',
}

export function KitButton({ children, variant = 'primary', className, type = 'button', loading = false, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: KitButtonVariant; loading?: boolean; children?: ReactNode }) {
  return <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-50', buttonVariants[variant], className)} {...props}>
    {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"/>}{children}
  </button>
}

const statusStyles: Record<string, string> = {
  Completed: 'bg-[#E8F5EA] text-[#337D44]',
  Matched: 'bg-[#E8F5EA] text-[#337D44]',
  Online: 'bg-[#E8F5EA] text-[#337D44]',
  Approved: 'bg-[#E8F5EA] text-[#337D44]',
  Pending: 'bg-[#FFF6E4] text-[#A76700]',
  Review: 'bg-[#FFF6E4] text-[#A76700]',
  'Awaiting approval': 'bg-[#FFF6E4] text-[#A76700]',
  Scheduled: 'bg-[#E7F1FC] text-[#1C6FA8]',
  Reversed: 'bg-[#FDEAEA] text-[#C72D34]',
  Rejected: 'bg-[#FDEAEA] text-[#C72D34]',
  Failed: 'bg-[#FDEAEA] text-[#C72D34]',
}

export function StatusPill({ value }: { value: string }) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold', statusStyles[value] ?? 'bg-muted text-muted-foreground')}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{value}</span>
}

const statTones = {
  green: 'bg-[#E8F5EA] text-secondary',
  blue: 'bg-[#E7F1FC] text-[#1C70AA]',
  amber: 'bg-[#FFF5E3] text-[#B57500]',
}

export function KitStatCard({ label, value, note, icon: Icon, tone = 'green' }: { label: string; value: string; note: string; icon: ElementType; tone?: keyof typeof statTones }) {
  return <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <div className={cn('grid h-9 w-9 place-items-center rounded-xl', statTones[tone])}><Icon size={16}/></div>
    </div>
    <p className="mt-3 text-[23px] font-extrabold tracking-[-0.025em] text-foreground">{value}</p>
    <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{note}</p>
  </div>
}
