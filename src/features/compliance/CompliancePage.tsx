import { ArrowRight, Building2, Check, Clock3, Landmark, MapPin, ShieldCheck, TriangleAlert, Users, type LucideIcon } from 'lucide-react'
import type { ComplianceItem, ComplianceState } from '@/api/compliance'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { VerificationProgress } from './components/VerificationProgress'
import { useCompliancePage } from './hooks/useCompliancePage'

const ICONS: Record<ComplianceItem['id'], LucideIcon> = { business: Building2, identity: Users, documents: ShieldCheck, address: MapPin, settlement: Landmark }

const STATES: Record<ComplianceState, { label: string; className: string; icon: LucideIcon }> = {
  done: { label: 'Complete', className: 'bg-accent text-brand', icon: Check },
  action: { label: 'To do', className: 'bg-[#FFF7DF] text-[#8F5F00]', icon: ArrowRight },
  review: { label: 'In review', className: 'bg-[#E8F2FF] text-[#1367D8]', icon: Clock3 },
  rejected: { label: 'Sent back', className: 'bg-[#FFF0F0] text-[#C72D34]', icon: TriangleAlert },
}

function ItemRow({ item, onOpen }: { item: ComplianceItem; onOpen: () => void }) {
  const Icon = ICONS[item.id]
  const state = STATES[item.state]
  const body = <>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-brand"><Icon size={18}/></span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-extrabold text-foreground">{item.title}</span>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold', state.className)}><state.icon size={10}/>{state.label}</span>
      </span>
      <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">{item.description}</span>
      <span className="mt-1 block text-[11px] font-bold text-foreground/75 [overflow-wrap:anywhere]">{item.detail}</span>
    </span>
  </>
  if (!item.viaKyc) return <div className="flex items-start gap-3 p-4 sm:p-5">{body}</div>
  return <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-[#FAFAFA] sm:p-5">
    {body}
    <ArrowRight size={15} className="mt-1 shrink-0 text-muted-foreground"/>
  </button>
}

export default function CompliancePage() {
  const page = useCompliancePage()
  return <KitPage className="mx-auto w-full max-w-5xl">
    <KitPageHeader
      eyebrow="Secure verification"
      title="Compliance"
      subtitle="Where your business stands. Finish verification to activate higher transaction limits, instant payouts and additional terminals."
    />
    {page.isError && <p role="alert" className="rounded-xl border border-[#E52929]/20 bg-[#FFF0F0] p-4 text-xs font-bold text-[#C72D34]">We could not load your verification status. Try again shortly.</p>}
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
      {page.isLoading
        ? <><CardSkeleton lines={6}/><CardSkeleton lines={6}/></>
        : <>
          <VerificationProgress page={page}/>
          <section className="min-w-0 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
            {page.items.map(item => <ItemRow key={item.id} item={item} onOpen={page.goToKyc}/>)}
          </section>
        </>}
    </div>
  </KitPage>
}
