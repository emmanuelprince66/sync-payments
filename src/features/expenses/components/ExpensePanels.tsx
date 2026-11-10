import { Check, Clock3, History, Plus, Send, Sparkles } from 'lucide-react'
import { KitEmpty } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { ExpensesModel } from '../hooks/useExpensesPage'

/** The design's operating position + spend by category card. */
export function OperatingCard({ page }: { page: ExpensesModel }) {
  const { position } = page
  return <section className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
    <div className="min-w-0 bg-primary p-5 text-white">
      <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-white/50">Operating position · {position.month}</p>
      {position.loading ? <Skeleton className="mt-3 h-9 w-40 bg-white/10"/> : <p className="mt-3 text-3xl font-extrabold [overflow-wrap:anywhere]">{position.value}</p>}
      <p className="mt-1 text-[10px] text-white/55">Income remaining after recorded expenses</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-secondary" style={{ width: `${position.percent}%` }}/></div>
      <div className="mt-3 flex justify-between gap-3 text-[9px]"><span><b>{position.income}</b><br/><i className="not-italic text-white/45">Income</i></span><span className="text-right"><b>{position.expenses}</b><br/><i className="not-italic text-white/45">Expenses</i></span></div>
    </div>
    <div className="min-w-0 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><h2 className="text-sm font-extrabold">Spend by category</h2><p className="mt-1 text-[9px] text-muted-foreground">Every expense requires a category</p></div>
        <KitButton variant="secondary" className="shrink-0" onClick={page.categoriesModal.open}><Plus size={12}/> Manage categories</KitButton>
      </div>
      {page.categoriesLoading
        ? <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-10"/>)}</div>
        : page.categories.length === 0
          ? <KitEmpty title="No categories yet" note="Add one to start tracking spend." className="py-6"/>
          : <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">{page.categories.map(category => <div key={category.id || category.name} className="min-w-0 text-left">
            <div className="flex justify-between gap-2 text-[10px]"><span className="truncate font-extrabold">{category.name}</span><span className="shrink-0 font-bold">{category.spentLabel}</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${category.percent}%`, background: category.color }}/></div>
            <p className="mt-1 text-[8px] text-muted-foreground">{category.percent}% of total spend</p>
          </div>)}</div>}
    </div>
  </section>
}

/** The next expense waiting on this person, as in the design's inline approval strip. */
export function InlineApproval({ page }: { page: ExpensesModel }) {
  if (!page.inline) return null
  const { expense, approved, amount } = page.inline
  return <section className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-[minmax(0,1fr)_auto]">
    <div className="flex min-w-0 items-center gap-4 p-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FFF6E4] text-[#A76700]"><Clock3 size={17}/></div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><p className="min-w-0 truncate text-xs font-extrabold">{expense.name} · {expense.reference}</p><span className={cn('rounded px-2 py-0.5 text-[8px] font-extrabold', approved ? 'bg-accent text-secondary' : 'bg-[#FFF6E4] text-[#A76700]')}>{approved ? 'APPROVED' : 'YOUR APPROVAL'}</span></div>
        <p className="mt-1 text-[10px] text-muted-foreground">{expense.owner || 'A team member'} requested {amount}{expense.note ? ` · ${expense.note}` : ''}</p>
        <div className="mt-2 flex items-center gap-4 text-[9px] text-muted-foreground"><span className="flex items-center gap-1"><History size={11}/> {expense.date || 'Today'}</span><span>{expense.category || 'Uncategorised'}</span></div>
      </div>
      <p className="ml-auto hidden shrink-0 text-lg font-extrabold sm:block">{amount}</p>
    </div>
    <div className="flex items-center gap-2 border-t border-border bg-[#FAFBFA] p-4 lg:border-l lg:border-t-0">
      <KitButton variant="secondary" onClick={page.audit.open}><History size={13}/> Audit trail</KitButton>
      {approved
        ? <KitButton onClick={page.scheduleTransfer}><Send size={13}/> Schedule transfer</KitButton>
        : <KitButton onClick={page.approveInline}><Check size={13}/> Approve</KitButton>}
    </div>
  </section>
}

/** The design's monthly budget card, with who spent what underneath. */
export function BudgetCard({ page }: { page: ExpensesModel }) {
  const { budget } = page
  return <section className="min-w-0 rounded-2xl border border-border bg-white p-5">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-extrabold">{budget.month} budget</h2><p className="mt-1 text-[10px] text-muted-foreground">Across all categories</p></div><span className="text-xs font-extrabold text-secondary">{budget.percent}%</span></div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-secondary" style={{ width: `${budget.percent}%` }}/></div>
    <div className="mt-3 flex justify-between gap-3"><span className="text-xs font-extrabold">{budget.spent} spent</span><span className="text-right text-[10px] text-muted-foreground">{budget.limit}</span></div>
    {budget.loading
      ? <div className="mt-6 flex flex-col gap-4">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-6"/>)}</div>
      : budget.rows.length > 0 && <div className="mt-6 flex flex-col gap-4">{budget.rows.map(row => <div key={row.id}>
        <div className="mb-1.5 flex justify-between gap-2 text-[10px]"><span className="truncate font-bold">{row.label}</span><span className="shrink-0 text-muted-foreground">{row.amount}</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${row.percent}%` }}/></div>
      </div>)}</div>}
    {page.spendByUser.length > 0 && <div className="mt-6 border-t border-border pt-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Spend by person</p>
      <div className="mt-3 flex flex-col gap-2">{page.spendByUser.map(row => <div key={row.id || row.name} className="flex justify-between gap-2 text-[10px]"><span className="truncate font-bold">{row.name}</span><span className="shrink-0 text-muted-foreground">{row.total}</span></div>)}</div>
    </div>}
    <div className="mt-6 rounded-xl bg-[#F4FAF5] p-4">
      <Sparkles size={16} className="text-secondary"/>
      <p className="mt-2 text-xs font-extrabold">Your approval policy</p>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{page.policy}</p>
      {page.permissions.isOwner && <button type="button" onClick={page.settingsModal.open} className="mt-2 text-[10px] font-extrabold text-secondary hover:underline">Change approval rules</button>}
    </div>
  </section>
}
