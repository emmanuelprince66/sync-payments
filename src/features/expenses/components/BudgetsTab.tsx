import { createColumnHelper } from '@tanstack/react-table'
import { AlertTriangle, PencilLine, PiggyBank, Plus, Target, TrendingDown, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { formatActivityDate } from '@/api/http'
import { DataTable } from '@/components/ui/DataTable'
import { KitEmpty, KitSearch, kitTableClass, StatTile, StatTileSkeleton } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import { cn } from '@/lib/cn'
import { useBudgetsTab, type BudgetHealth, type BudgetRow } from '../hooks/useBudgetsTab'
import { BudgetModal } from './BudgetModal'

const column = createColumnHelper<BudgetRow>()

const BAR: Record<BudgetHealth, string> = { over: 'bg-[#C72D34]', near: 'bg-[#D99A1E]', ok: 'bg-secondary' }
const PILL: Record<BudgetHealth, string> = { over: 'bg-[#FDEAEA] text-[#C72D34]', near: 'bg-[#FFF6E4] text-[#A76700]', ok: 'bg-accent text-secondary' }

/** Spent vs budget, with sink's "Over budget" wording past 100%. */
function Usage({ row, money }: { row: BudgetRow; money: (value: number) => string }) {
  return <div className="min-w-[180px]">
    <div className="flex justify-between gap-2 text-[10px]"><span className="font-bold">{money(row.spent)} <span className="font-normal text-muted-foreground">of {money(row.total)}</span></span><span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold', PILL[row.health])}>{row.health === 'over' ? 'Over budget' : `${row.percent}%`}</span></div>
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', BAR[row.health])} style={{ width: `${Math.min(row.percent, 100)}%` }}/></div>
  </div>
}

/** Expenses › Budgets: sink's Budgets screen with the spend progress from its category cards. */
export function BudgetsTab() {
  const page = useBudgetsTab()
  const { money } = page

  const columns = useMemo(() => [
    column.display({ id: 'category', header: 'Category', meta: { headerClassName: 'px-5', cellClassName: 'px-5' }, cell: ({ row: { original } }) => <div><p className="font-extrabold">{original.categoryName}</p><p className="mt-1 text-[9px] text-muted-foreground">{original.year} · {original.months} {original.months === 1 ? 'month' : 'months'}</p></div> }),
    column.display({ id: 'usage', header: 'Spent vs budget', cell: ({ row: { original } }) => <Usage row={original} money={money}/> }),
    column.display({ id: 'monthly', header: 'Monthly', meta: { headerClassName: 'text-right', cellClassName: 'text-right' }, cell: ({ row: { original } }) => <span className="font-bold text-foreground/70">{money(original.monthly || (original.months ? original.total / original.months : 0))}</span> }),
    column.display({ id: 'remaining', header: 'Remaining', meta: { headerClassName: 'text-right', cellClassName: 'text-right' }, cell: ({ row: { original } }) => <span className={cn('font-extrabold', original.remaining < 0 && 'text-[#C72D34]')}>{money(original.remaining)}</span> }),
    column.display({ id: 'created', header: 'Created', cell: ({ row: { original } }) => <span className="text-muted-foreground">{original.createdAt ? formatActivityDate(original.createdAt) : '—'}</span> }),
    column.display({ id: 'edit', header: '', meta: { headerClassName: 'px-5', cellClassName: 'px-5 text-right' }, cell: ({ row: { original } }) => page.canManage && <button type="button" aria-label={`Edit ${original.categoryName} budget`} onClick={() => page.edit(original)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><PencilLine size={15}/></button> }),
  ], [money, page])

  return <div className="flex flex-col gap-5">
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(4,minmax(0,1fr))]">
      {page.loading
        ? Array.from({ length: 4 }, (_, index) => <StatTileSkeleton key={index}/>)
        : <>
          <StatTile label="Total budgeted" value={page.summary.budgeted} note={`${page.count} ${page.count === 1 ? 'budget' : 'budgets'}`} icon={Target}/>
          <StatTile label="Spent against budgets" value={page.summary.spent} note={`${page.summary.percent}% used`} icon={Wallet} tone="blue"/>
          <StatTile label="Remaining" value={page.summary.remaining} note="Across every budget" icon={PiggyBank}/>
          <StatTile label="Over budget" value={String(page.summary.overCount)} note={page.summary.overCount ? 'Categories past their limit' : 'Everything is within budget'} icon={TrendingDown} tone="amber"/>
        </>}
    </div>

    {page.alerts.length > 0 && <section aria-label="Budget alerts" className="flex flex-col gap-2">
      {page.alerts.map(alert => <div key={alert.id} role="status" className={cn('flex items-start gap-2.5 rounded-xl border p-3 text-[11px] font-bold', alert.tone === 'over' ? 'border-[#EC1B24]/20 bg-[#FDEAEA] text-[#7A1F24]' : 'border-[#D99A1E]/25 bg-[#FFF9EC] text-[#7A5310]')}>
        <AlertTriangle size={15} className="mt-0.5 shrink-0"/>{alert.text}
      </div>)}
    </section>}

    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <KitSearch value={page.search} onChange={page.setSearch} placeholder="Search by category"/>
        {page.canManage && <KitButton onClick={() => page.create()} className="w-full sm:w-auto"><Plus size={14}/> Create budget</KitButton>}
      </div>
      <DataTable
        columns={columns}
        data={page.rows}
        loading={page.loading}
        minWidthClassName="min-w-[820px]"
        className={cn(kitTableClass, '[&_tbody_tr]:static')}
        getRowId={row => row.id}
        emptyState={<KitEmpty icon={<PiggyBank size={18}/>} title={page.search ? 'No budgets match that search' : 'No budgets yet'} note="Create a budget for a category to start tracking spend against it." className="py-4"/>}
        mobileListClassName="divide-y divide-border/70"
        renderMobileCard={row => <button type="button" disabled={!page.canManage} onClick={() => page.edit(row)} className="w-full p-4 text-left text-xs">
          <span className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block truncate font-extrabold">{row.categoryName}</span><span className="mt-1 block text-[10px] text-muted-foreground">{row.year} · {row.months} {row.months === 1 ? 'month' : 'months'}</span></span><span className={cn('shrink-0 font-extrabold', row.remaining < 0 && 'text-[#C72D34]')}>{money(row.remaining)} left</span></span>
          <span className="mt-3 block"><Usage row={row} money={money}/></span>
        </button>}
      />
    </section>

    {page.unbudgeted.length > 0 && page.canManage && <section className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-sm font-extrabold">Spending without a budget</h2>
      <p className="mt-1 text-[10px] text-muted-foreground">These categories have spend this year but nothing to measure it against.</p>
      <div className="mt-4 divide-y divide-border">{page.unbudgeted.map(row => <div key={row.id} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="truncate text-xs font-extrabold">{row.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{row.spent} spent</p></div>
        <KitButton variant="secondary" onClick={() => page.create(row.id)}><Plus size={12}/> Set budget</KitButton>
      </div>)}</div>
    </section>}

    <BudgetModal open={page.modal.open} budget={page.modal.budget} presetCategoryId={page.modal.presetCategoryId} onClose={page.modal.close}/>
  </div>
}
