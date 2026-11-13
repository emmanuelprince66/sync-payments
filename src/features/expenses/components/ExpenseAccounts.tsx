import { ArrowUpRight, Check, Copy, Plus, Wallet } from 'lucide-react'
import { KitEmpty } from '@/components/ui/KitExtras'
import { KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton'
import type { ExpenseAccountRow, ExpenseAccountsModel } from '../hooks/useExpenseAccounts'

function CopyNumber({ account, model, light }: { account: ExpenseAccountRow; model: ExpenseAccountsModel; light?: boolean }) {
  const copied = model.copiedId === account.id
  return <button type="button" onClick={() => model.copyNumber(account)} aria-label={`Copy account number ${account.accountNumber}`} className={light ? 'inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-extrabold text-white hover:bg-white/20' : 'inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-[11px] font-extrabold text-secondary hover:bg-accent'}>
    {copied ? <Check size={12}/> : <Copy size={12}/>}{copied ? 'Copied' : 'Copy'}
  </button>
}

type Actions = { onCreate: () => void; onTransfer: (accountId: string) => void }

/** The Expenses header card: the selected expense account's number, bank and balance (sink: ExpenseAccountBalanceCard). */
export function ExpenseAccountCard({ model, onCreate, onTransfer }: { model: ExpenseAccountsModel } & Actions) {
  const account = model.selected
  return <section className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-white md:grid-cols-[minmax(0,1fr)_auto]">
    <div className="min-w-0 bg-primary p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-white/60"><Wallet size={14}/> Expense account</p>
        {model.hasMultiple && <KitSelect label="Spending from" className="w-full sm:w-64 [&>span]:text-white/60" boxClassName="h-9 border-white/15 bg-white/10 text-white" options={model.accounts.map(row => ({ value: row.id, label: `${row.label} · ${row.accountNumber}` }))} value={account?.id ?? ''} onChange={event => model.select(event.target.value)}/>}
      </div>
      {model.loading
        ? <Skeleton className="mt-3 h-9 w-48 bg-white/10"/>
        : account
          ? <>
            <p className="mt-3 truncate text-sm font-extrabold">{account.label}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/75">
              <span>{account.bank}</span><span aria-hidden="true">·</span>
              <span className="font-mono text-sm font-bold tracking-wider text-white">{account.accountNumber || '—'}</span>
              <CopyNumber account={account} model={model} light/>
            </div>
            {model.balancesLoading ? <Skeleton className="mt-4 h-9 w-40 bg-white/10"/> : <p className="mt-4 text-3xl font-extrabold [overflow-wrap:anywhere]">{account.balance}</p>}
            <p className="mt-1 text-[11px] text-white/55">Available for operational spending · expenses are paid from this account</p>
          </>
          : <>
            <p className="mt-3 text-lg font-extrabold">No expense account yet</p>
            <p className="mt-1 max-w-md text-[11px] leading-4 text-white/60">Create one to hold a float your team can spend from, separately from your takings.</p>
          </>}
    </div>
    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-[#FAFBFA] p-4 md:flex-col md:items-stretch md:justify-center md:border-l md:border-t-0">
      {account && model.canTransfer && <KitButton onClick={() => onTransfer(account.id)}><ArrowUpRight size={14}/> Transfer money</KitButton>}
      {model.canCreate && <KitButton variant={account ? 'secondary' : 'primary'} onClick={onCreate}><Plus size={14}/> Create expense account</KitButton>}
    </div>
  </section>
}

/** Expenses › Accounts: every expense account the business holds, with its number (copy) and balance. */
export function ExpenseAccountsTab({ model, onCreate, onTransfer }: { model: ExpenseAccountsModel } & Actions) {
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white">
    <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><h2 className="text-sm font-extrabold">Expense accounts</h2><p className="mt-1 text-[11px] text-muted-foreground">{model.hasAccount ? `${model.accounts.length} ${model.accounts.length === 1 ? 'account' : 'accounts'} · ${model.total} in total` : 'Dedicated accounts your team spends from.'}</p></div>
      {model.canCreate && <KitButton onClick={onCreate} className="w-full sm:w-auto"><Plus size={14}/> Create expense account</KitButton>}
    </div>
    {model.loading
      ? <ListSkeleton rows={2} className="p-2"/>
      : !model.hasAccount
        ? <KitEmpty icon={<Wallet size={18}/>} title="No expense account yet" note="Create one to separate company spend from your main business funds." action={model.canCreate ? <KitButton onClick={onCreate}><Plus size={14}/> Create expense account</KitButton> : undefined}/>
        : <ul className="divide-y divide-border">
          {model.accounts.map(account => <li key={account.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-secondary"><Wallet size={17}/></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{account.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{account.fullName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{account.bank}</span><span aria-hidden="true">·</span>
                <span className="font-mono text-sm font-bold tracking-wider text-foreground">{account.accountNumber || '—'}</span>
                {account.accountNumber && <CopyNumber account={account} model={model}/>}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
              <div className="sm:text-right"><p className="text-[10px] text-muted-foreground">Balance</p>{model.balancesLoading ? <Skeleton className="mt-1 h-5 w-24"/> : <p className="mt-0.5 text-lg font-extrabold">{account.balance}</p>}</div>
              {model.canTransfer && <KitButton variant="secondary" onClick={() => onTransfer(account.id)}><ArrowUpRight size={13}/> Transfer</KitButton>}
            </div>
          </li>)}
        </ul>}
  </section>
}
