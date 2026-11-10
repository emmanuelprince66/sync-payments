import { BadgeCheck, CreditCard, Mail, MonitorSmartphone, Plus, QrCode, TriangleAlert } from 'lucide-react'
import { KitEmpty, KitModal, StatTile, StatTileSkeleton } from '@/components/ui/KitExtras'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton, StatusPill } from '@/components/ui/PaymentKit'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { PayCardModal } from './components/PayCardModal'
import { TerminalPayments } from './components/TerminalPayments'
import { useTerminalsPage } from './hooks/useTerminalsPage'

export default function TerminalsPage() {
  const page = useTerminalsPage()

  return <KitPage>
    <KitPageHeader
      title="Terminals"
      subtitle="Manage devices and monitor collections by location."
      actions={<div className="flex gap-2">
        <KitButton variant="secondary" onClick={page.payCard.open}><QrCode size={14}/> Pay card</KitButton>
        <KitButton onClick={page.addInfo.open}><Plus size={14}/> Add terminal</KitButton>
      </div>}
    />

    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
      {page.statsLoading || page.loading
        ? Array.from({ length: 3 }, (_, index) => <StatTileSkeleton key={index}/>)
        : <>
          <StatTile label="Active terminals" value={String(page.activeCount)} note={`${page.totalCount} assigned to this business`} icon={MonitorSmartphone}/>
          <StatTile label="Today's volume" value={page.todayVolume} note={`${page.todayCount} successful payments`} icon={CreditCard} tone="blue"/>
          <StatTile label="Approval rate" value={page.approvalRate} note={page.approvalNote} icon={BadgeCheck}/>
        </>}
    </div>

    {page.loading
      ? <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <CardSkeleton key={index}/>)}</div>
      : page.terminals.length === 0
        ? <section className="rounded-2xl border border-border bg-white"><KitEmpty icon={<MonitorSmartphone size={18}/>} title="No terminals yet" note="Sync360 assigns terminals to your business. Once one is assigned, its collections show up here." action={<KitButton onClick={page.addInfo.open}><Plus size={14}/> Request a terminal</KitButton>}/></section>
        : <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">{page.terminals.map((terminal, index) => <button key={terminal.id} type="button" onClick={() => page.selectTerminal(terminal.terminalId)} aria-pressed={terminal.selected} className={cn('min-w-0 rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg', terminal.selected ? 'border-secondary' : 'border-border')}>
          <span className="flex items-start">
            <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', index % 2 ? 'bg-primary text-white' : 'bg-accent text-secondary')}><MonitorSmartphone size={20}/></span>
            <span className="ml-3 min-w-0"><span className="block truncate text-sm font-extrabold">{terminal.name || terminal.terminalId}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{terminal.terminalId} · {terminal.serialNumber || 'No serial'}</span></span>
            <span className="ml-auto shrink-0 pl-2"><StatusPill value={terminal.active ? 'Online' : 'Offline'}/></span>
          </span>
          <span className="mt-5 grid grid-cols-[repeat(2,minmax(0,1fr))] border-t border-border pt-4">
            <span className="min-w-0"><span className="block text-[10px] text-muted-foreground">Collected today</span><span className="mt-1 block text-lg font-extrabold [overflow-wrap:anywhere]">{terminal.today}</span></span>
            <span className="min-w-0 border-l border-border pl-5"><span className="block text-[10px] text-muted-foreground">Transactions</span><span className="mt-1 block text-lg font-extrabold">{terminal.count}</span></span>
          </span>
          {!terminal.accountMatches && <span className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[#A76700]"><TriangleAlert size={13} className="shrink-0"/>Settlement account differs from the processor's record.</span>}
        </button>)}</div>}

    <TerminalPayments payments={page.payments}/>

    <PayCardModal card={page.payCard}/>
    <KitModal
      open={page.addInfo.isOpen}
      onClose={page.addInfo.close}
      title="Add a terminal"
      description="Terminals are assigned to your business by the Sync360 team."
      icon={<MonitorSmartphone size={16}/>}
      panelClassName="max-w-md"
      footer={<><KitButton variant="secondary" onClick={page.addInfo.close}>Close</KitButton><a href="mailto:support@sync360.africa?subject=Terminal%20request" className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#438351]"><Mail size={14}/> Email support</a></>}
    >
      <p className="text-xs leading-5 text-muted-foreground">Tell us how many devices you need and where they will be used. Once assigned, they appear here automatically and settle into your account.</p>
    </KitModal>
  </KitPage>
}
