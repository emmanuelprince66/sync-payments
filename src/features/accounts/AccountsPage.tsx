import { ArrowDownLeft, ArrowUpRight, Building2, Clock3, Download, FileText, Landmark, Plus, RefreshCw, Send, Settings, ShieldCheck, Store, Trash2, WalletCards, type LucideIcon } from 'lucide-react'
import { KitEmpty } from '@/components/ui/KitExtras'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { CardSkeleton, ListSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { maskAccount } from '@/features/transactions/format'
import { cn } from '@/lib/cn'
import { AccountCard } from './components/AccountCard'
import { FundModal, PayoutBankModal, SubAccountModal } from './components/AccountModals'
import { AccountRulesModal } from './components/AccountRulesModal'
import { KycPromptModal } from './components/KycPromptModal'
import { useAccountsPage } from './hooks/useAccountsPage'

export default function AccountsPage() {
  const page = useAccountsPage()
  const { current } = page
  const flows: [string, string, LucideIcon][] = [['Money in', page.flows.moneyIn, ArrowDownLeft], ['Money out', page.flows.moneyOut, ArrowUpRight], ['Pending', page.flows.pending, Clock3]]
  const capabilities: [LucideIcon, string, string][] = [[WalletCards, `Receive ${page.currency}`, 'Bank transfers into this account'], [Store, 'Terminal sales', 'All your locations'], [Send, 'Send payouts', 'Same or next day'], [FileText, 'Statements', 'Export as CSV']]

  return <KitPage>
    <KitPageHeader
      eyebrow="Treasury"
      title="Accounts"
      subtitle="A consolidated view of every collection, expense, payroll, and reserve account."
      actions={<div className="flex gap-2">
        <KitButton variant="secondary" onClick={() => void page.sync()} loading={page.syncing}>{!page.syncing && <RefreshCw size={14}/>} Sync banks</KitButton>
        {page.canManage && <KitButton onClick={page.subAccount.open}><Plus size={14}/> Add account</KitButton>}
      </div>}
    />

    {page.loading
      ? <CardSkeleton lines={5}/>
      : page.empty
        ? <section className="rounded-xl border border-border bg-white"><KitEmpty icon={<Landmark size={18}/>} title="No accounts yet" note="Complete your business verification and your first account opens automatically." action={<KitButton onClick={page.kyc.goTo}><ShieldCheck size={14}/> Complete KYC</KitButton>}/></section>
        : <section className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-[310px_minmax(0,1fr)]">
          <div className="min-w-0 border-b border-border p-3 lg:border-b-0 lg:border-r">
            <div className="px-2 py-2 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">General account · {page.subCount} sub-{page.subCount === 1 ? 'account' : 'accounts'}</div>
            {page.accounts.map(account => <button key={account.id} type="button" aria-pressed={account.selected} onClick={() => page.select(account.id)} className={cn('mt-1 flex w-full items-center gap-3 rounded-lg p-3 text-left', account.selected ? 'bg-accent' : 'hover:bg-muted/70')}>
              <span className={cn('h-8 w-1 shrink-0 rounded-full', account.color)}/>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold">{account.name}</span><span className="mt-0.5 block truncate text-[9px] text-muted-foreground">{account.bank} {account.number}</span></span>
              <span className="shrink-0 text-[10px] font-extrabold">{account.balance}</span>
            </button>)}
          </div>
          {current && <div className="min-w-0 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row">
              <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{current.purpose}</p><h2 className="mt-2 truncate text-xl font-extrabold">{current.name}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{current.bank} · Account {current.number}</p></div>
              <div className="min-w-0 sm:text-right"><p className="text-[10px] text-muted-foreground">Available balance</p><p className="mt-1 text-3xl font-extrabold tracking-[-.03em] [overflow-wrap:anywhere]">{current.balance}</p></div>
            </div>
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
              {flows.map(([label, value, Icon]) => <div key={label} className="min-w-0 border-l-2 border-border pl-4"><Icon size={14} className="text-secondary"/><p className="mt-3 text-[9px] text-muted-foreground">{label}</p>{page.flows.loading ? <Skeleton className="mt-1 h-4 w-24"/> : <p className="mt-1 text-sm font-extrabold [overflow-wrap:anywhere]">{value}</p>}</div>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-5">
              <KitButton onClick={page.transfer}><Send size={14}/> Make transfer</KitButton>
              <KitButton variant="secondary" onClick={page.fund.open}><Plus size={14}/> Fund</KitButton>
              <KitButton variant="secondary" onClick={page.statement}><Download size={14}/> Statement</KitButton>
              <KitButton variant="secondary" onClick={page.rules.show}><Settings size={14}/> Account rules</KitButton>
            </div>
          </div>}
        </section>}

    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
      <div className="min-w-0 rounded-xl border border-border bg-primary p-5 text-white md:col-span-2">
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/50">Total cash across accounts</p>
        {page.loading ? <Skeleton className="mt-2 h-9 w-48 bg-white/10"/> : <p className="mt-2 text-3xl font-extrabold [overflow-wrap:anywhere]">{page.total}</p>}
        <div className="mt-5 flex gap-1">{page.split.map(part => <div key={part.id} className={cn('h-2 rounded-full', part.color)} style={{ width: `${part.width}%` }}/>)}</div>
      </div>
      <div className="min-w-0 rounded-xl border border-border bg-white p-5"><p className="text-[10px] font-extrabold text-muted-foreground">Bank connections</p><p className="mt-2 text-2xl font-extrabold">{page.connections}</p><p className="mt-1 text-[9px] text-secondary">{page.syncedNote}</p></div>
    </div>

    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
      <AccountCard account={page.card} loading={page.loading}/>
      <div className="min-w-0 rounded-[22px] border border-border bg-white p-6">
        <div className="flex items-center justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-secondary"><Building2 size={18}/></div><span className="rounded-full bg-[#E8F5EA] px-2.5 py-1 text-[10px] font-extrabold text-[#337D44]">PAYOUT ACCOUNT</span></div>
        {page.payoutsLoading
          ? <ListSkeleton rows={1} className="mt-4"/>
          : page.payouts.length === 0
            ? <KitEmpty title="No payout account yet" note="Add the bank account withdrawals should reach." className="py-6"/>
            : <div className="mt-4 divide-y divide-border">{page.payouts.map(payout => <div key={payout.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{payout.bankName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{payout.accountName} · {maskAccount(payout.accountNumber)}</p></div>
              <span className="shrink-0 text-xs font-extrabold text-secondary">Connected</span>
              {page.canManage && <button type="button" aria-label={`Remove ${payout.bankName}`} disabled={page.removing} onClick={() => page.removePayout(payout.id)} className="shrink-0 rounded-md p-1.5 text-[#C72D34] hover:bg-[#FDEAEA]"><Trash2 size={14}/></button>}
            </div>)}</div>}
        {page.canManage && <KitButton variant="secondary" onClick={page.payoutBank.open} className="mt-4 w-full"><Plus size={14}/> Add payout account</KitButton>}
      </div>
    </div>

    <section className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-extrabold">Account capabilities</h2>
        <button type="button" onClick={page.kyc.goTo} className="flex items-center gap-2 text-left text-[10px] font-extrabold text-secondary hover:underline"><ShieldCheck size={14} className="shrink-0"/>{page.kyc.loading ? 'Checking verification…' : `${page.kyc.tierLabel} · ${page.kyc.note}`}</button>
      </div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(4,minmax(0,1fr))]">
        {capabilities.map(([Icon, title, note]) => <div key={title} className="rounded-xl bg-[#F8FAF8] p-4"><Icon size={17} className="text-secondary"/><p className="mt-3 text-xs font-extrabold">{title}</p><p className="mt-1 text-[10px] text-muted-foreground">{note}</p></div>)}
      </div>
    </section>

    <SubAccountModal open={page.subAccount.isOpen} onClose={page.subAccount.close}/>
    <PayoutBankModal open={page.payoutBank.isOpen} onClose={page.payoutBank.close}/>
    <FundModal page={page}/>
    <AccountRulesModal open={page.rules.open} section={page.rules.section} onSectionChange={page.rules.setSection} onClose={page.rules.close}/>
    <KycPromptModal open={page.kycPrompt.open} onClose={page.kycPrompt.close} onVerify={page.kycPrompt.verify}/>
  </KitPage>
}
