import { BadgeCheck, CalendarClock, Percent } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { BnplCard } from './components/BnplCard'
import { PendingBnplPanel } from './components/PendingBnplPanel'
import { BNPL_FEE_LABEL } from './eligibility'
import { useBnplPage } from './hooks/useBnplPage'

const facts = [
  { icon: BadgeCheck, title: 'Akawopay decides', note: 'Who qualifies, the repayment plan, and collections. You never chase a customer.' },
  { icon: CalendarClock, title: 'Settled in 24 hours', note: 'Each approved order is paid into your wallet on Akawopay’s settlement cycle.' },
  { icon: Percent, title: 'One simple fee', note: BNPL_FEE_LABEL },
]

/** Akawopay (Buy Now, Pay Later): set-up, eligibility and activation, then the settlements on their way to the wallet. */
export default function BnplPage() {
  const page = useBnplPage()
  return <KitPage>
    <KitPageHeader eyebrow="Akawopay" title="Buy Now Pay Later" subtitle="Let customers pay in instalments while you get paid in full."/>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {page.isLoading ? <CardSkeleton className="rounded-xl border border-border bg-white p-4" lines={3}/> : <BnplCard active={page.active}/>}
      <ul className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
        {facts.map(({ icon: Icon, title, note }) => <li key={title} className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-secondary"><Icon size={15}/></span>
          <span className="min-w-0"><span className="block text-xs font-extrabold">{title}</span><span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{note}</span></span>
        </li>)}
      </ul>
    </div>
    <PendingBnplPanel/>
  </KitPage>
}
