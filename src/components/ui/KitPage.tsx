import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Page wrapper and header row, class-for-class from the Payments design. */
export function KitPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex min-w-0 flex-col gap-6 p-5 md:p-8', className)}>{children}</div>
}

export function KitPageHeader({ eyebrow, title, subtitle, badge, actions }: { eyebrow?: string; title: string; subtitle: string; badge?: ReactNode; actions?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div className="min-w-0">
      {eyebrow && <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-secondary">{eyebrow}</p>}
      <div className={cn('flex flex-wrap items-center gap-3', eyebrow && 'mt-1')}>
        <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-foreground">{title}</h1>
        {badge}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {actions}
  </div>
}
