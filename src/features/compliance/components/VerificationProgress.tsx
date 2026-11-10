import { ArrowRight, Check } from 'lucide-react'
import { KitButton } from '@/components/ui/PaymentKit'
import { cn } from '@/lib/cn'
import type { ComplianceModel } from '../hooks/useCompliancePage'

/** The tier ladder and how far along it this business is. */
export function VerificationProgress({ page }: { page: ComplianceModel }) {
  return <section className="min-w-0 rounded-2xl bg-primary p-6 text-white">
    <div className="flex items-center justify-between gap-2">
      <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-white/50">Verification progress</p>
      {page.tierLabel && <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-extrabold text-[#BDE7C6]">{page.tierLabel}</span>}
    </div>
    <p className="mt-3 text-4xl font-extrabold">{page.percent}%</p>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-secondary" style={{ width: `${page.percent}%` }}/></div>
    <div className="mt-7 flex flex-col gap-5">
      {page.rungs.map(rung => <div key={rung.tier} className="flex items-start">
        <div className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-extrabold', rung.done ? 'bg-secondary text-white' : 'border border-white/20 text-white/50')}>{rung.done ? <Check size={13}/> : rung.tier}</div>
        <div className="ml-3 min-w-0"><p className={cn('text-xs font-extrabold', rung.done ? 'text-white' : 'text-white/60')}>Tier {rung.tier} · {rung.title}</p><p className="mt-1 text-[10px] leading-4 text-white/50">{rung.limit} daily limit</p></div>
      </div>)}
    </div>
    <KitButton onClick={page.goToKyc} className="mt-7 w-full">{page.actionLabel} <ArrowRight size={14}/></KitButton>
  </section>
}
