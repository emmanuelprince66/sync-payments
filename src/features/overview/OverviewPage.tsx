import { ArrowDownLeft, ArrowRight, ArrowUpRight, Clock3, Download, ReceiptText, Send, ShieldCheck } from 'lucide-react'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { StatTile, StatTileSkeleton } from '@/components/ui/KitExtras'
import { KitPage } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { AccountCard } from '@/features/accounts/components/AccountCard'
import { TransferModal } from '@/features/payments/components/TransferModal'
import { TransactionDialogs } from '@/features/transactions/components/TransactionDialogs'
import { TransactionTable } from '@/features/transactions/components/TransactionTable'
import { FlowCard } from './components/FlowCard'
import { useOverviewPage } from './hooks/useOverviewPage'
// Reconciliation is switched off for now; restore these with the card below.
// import { FileCheck2 } from 'lucide-react'
// import { SampleDataBadge } from '@/components/ui/misc'

export default function OverviewPage() {
  const page = useOverviewPage()
  // const { reconciliation } = page.sample

  return <KitPage>
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="min-w-0"><p className="text-xs font-bold text-secondary">{page.date}</p><h1 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-foreground md:text-[28px]">{page.greeting}</h1><p className="mt-1 text-sm text-muted-foreground">Here is how your payments are moving.</p></div>
      <div className="flex flex-wrap gap-2"><DateRangeFilter value={page.range.value} onChange={page.range.set} placeholder="All dates" className="w-full sm:w-auto"/>{page.can.viewTransactions && <KitButton variant="secondary" onClick={page.statement}><Download size={14}/> Statement</KitButton>}{page.can.transfer && <KitButton onClick={page.transfer.open}><Send size={14}/> Transfer</KitButton>}</div>
    </div>

    {page.needsKyc && <button type="button" onClick={page.goToKyc} className="flex w-full items-center gap-3 rounded-xl border border-[#E7D7AE] bg-[#FFF9EC] p-4 text-left">
      <ShieldCheck size={17} className="shrink-0 text-[#A76700]"/>
      <span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-foreground">Complete your KYC verification</span><span className="mt-1 block text-[10px] leading-4 text-muted-foreground">Your history is available, but transfers need a verified business.</span></span>
      <ArrowRight size={14} className="shrink-0 text-[#A76700]"/>
    </button>}

    {page.can.viewTransactions && <div className={page.can.manageWallet ? 'grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)]' : 'grid grid-cols-[minmax(0,1fr)] gap-5'}>
      {page.can.manageWallet && <AccountCard account={page.account} loading={page.loading}/>}
      <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4">
        {page.loading
          ? Array.from({ length: 4 }, (_, index) => <StatTileSkeleton key={index}/>)
          : <>
            <StatTile label="Today's inflow" value={page.stats.todayInflow} note={page.stats.todayNote} icon={ArrowDownLeft}/>
            <StatTile label="Processing" value={page.stats.processing} note={page.stats.processingNote} icon={Clock3} tone="amber"/>
            <StatTile label="Transactions" value={page.stats.count} note={page.stats.countNote} icon={ReceiptText} tone="blue"/>
            <StatTile label="Transferred out" value={page.stats.paidOut} note={page.stats.paidOutNote} icon={ArrowUpRight}/>
          </>}
      </div>
    </div>}

    {page.can.viewTransactions && <FlowCard page={page}/>}
    {/* Reconciliation is switched off for now. To restore: put FlowCard back in this grid with the card below.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,.85fr)]">
      <FlowCard page={page}/>
      <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_rgba(29,38,28,.035)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-extrabold text-foreground">Reconciliation</h2><SampleDataBadge/></div><p className="mt-1 text-[11px] text-muted-foreground">{reconciliation.label}</p></div>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-secondary"><FileCheck2 size={17}/></div>
        </div>
        <div className="my-6 text-center"><div className="relative mx-auto grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(#529661 0 ${reconciliation.percent}%, #E8F0EA ${reconciliation.percent}% 100%)` }}><div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-white"><div><p className="text-2xl font-extrabold text-foreground">{reconciliation.percent}%</p><p className="text-[9px] font-bold text-muted-foreground">MATCHED</p></div></div></div></div>
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4"><div><p className="text-[10px] text-muted-foreground">Matched</p><p className="mt-1 text-sm font-extrabold text-foreground">{reconciliation.matched.toLocaleString()}</p></div><div><p className="text-[10px] text-muted-foreground">Needs review</p><p className="mt-1 text-sm font-extrabold text-[#A76700]">{reconciliation.review}</p></div></div>
        <KitButton variant="secondary" onClick={page.goToReconciliation} className="mt-4 w-full">Review exceptions <ArrowRight size={14}/></KitButton>
      </section>
    </div>
    */}

    {page.can.viewTransactions && <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(29,38,28,.035)]">
      <div className="flex items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><h2 className="text-sm font-extrabold text-foreground">Recent transactions</h2><p className="mt-1 text-[11px] text-muted-foreground">Latest activity across all payment channels</p></div><button type="button" onClick={page.goToTransactions} className="flex shrink-0 items-center gap-1 text-[11px] font-extrabold text-secondary hover:underline">View all <ArrowRight size={13}/></button></div>
      <TransactionTable rows={page.recent} loading={page.loading} accountLabel={page.accountLabel} onSelect={page.details.open}/>
    </section>}

    <TransactionDialogs details={page.details} accountLabel={page.accountLabel}/>
    <TransferModal open={page.transfer.isOpen} onClose={page.transfer.close}/>
  </KitPage>
}
