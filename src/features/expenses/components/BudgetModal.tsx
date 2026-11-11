import { CalendarRange, PiggyBank, Trash2 } from 'lucide-react'
import { KitModal, KitMoneyField } from '@/components/ui/KitExtras'
import { KitField, KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { cn } from '@/lib/cn'
import { DURATION_PICKS, useBudgetForm } from '../hooks/useBudgetForm'
import type { BudgetRow } from '../hooks/useBudgetsTab'

const dangerClass = 'inline-flex items-center gap-2 rounded-lg border border-[#EC1B24]/30 px-4 py-2.5 text-xs font-extrabold text-[#C72D34] hover:bg-[#FDEAEA] disabled:opacity-50'

/** Set or change one category's budget (sink: SetCategoryBudgetModal). */
export function BudgetModal({ open, budget, presetCategoryId, onClose }: { open: boolean; budget: BudgetRow | null; presetCategoryId: string; onClose: () => void }) {
  const model = useBudgetForm({ open, budget, presetCategoryId, onClose })
  const { symbol } = useBusinessCurrency()
  const { register } = model.form

  const footer = model.confirming
    ? <><KitButton variant="secondary" onClick={model.cancelRemove}>Keep it</KitButton><button type="button" disabled={model.removing} onClick={model.remove} className={dangerClass}>{model.removing ? 'Removing…' : 'Yes, remove'}</button></>
    : <>
      {model.editing ? <button type="button" onClick={model.askRemove} className={dangerClass}><Trash2 size={14}/> Remove</button> : <KitButton variant="secondary" onClick={onClose}>Cancel</KitButton>}
      <KitButton onClick={model.submit} loading={model.saving}>{model.editing ? 'Save budget' : 'Create budget'}</KitButton>
    </>

  return <KitModal open={open} onClose={onClose} title={model.editing ? `${budget?.categoryName} budget` : 'Create budget'} description="Spend in this category is tracked against the amount over the months you choose." icon={<PiggyBank size={16}/>} panelClassName="max-w-md" footer={footer}>
    <form onSubmit={model.submit} noValidate className="flex flex-col gap-4">
      <KitSelect label="Category" disabled={model.categoryLocked || model.categoriesLoading} error={model.errors.categoryId?.message} {...register('categoryId')}>
        <option value="">{model.categoriesLoading ? 'Loading categories…' : 'Select a category'}</option>
        {model.categoryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </KitSelect>
      <KitMoneyField label="Total budget" symbol={symbol} inputMode="decimal" placeholder="0" error={model.errors.total?.message} {...register('total')}/>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <KitField label="Duration (months)" inputMode="numeric" error={model.errors.months?.message} {...register('months')}/>
        <KitSelect label="Year" error={model.errors.year?.message} {...register('year')}>
          {model.years.map(year => <option key={year} value={year}>{year}</option>)}
        </KitSelect>
      </div>
      <div className="flex flex-wrap gap-2">
        {DURATION_PICKS.map(value => <button key={value} type="button" aria-pressed={model.months === String(value)} onClick={() => model.pickMonths(value)} className={cn('rounded-lg px-3 py-2 text-[10px] font-extrabold', model.months === String(value) ? 'bg-primary text-white' : 'border border-border text-muted-foreground hover:bg-muted')}>{value} {value === 1 ? 'month' : 'months'}</button>)}
      </div>
      <div className="rounded-xl bg-accent p-4">
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-secondary">Monthly allocation</p>
        <p className="mt-1 text-xl font-extrabold">{model.monthlyLabel}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground"><CalendarRange size={12}/> The total spread evenly over the duration.</p>
      </div>
      {model.confirming && <p className="rounded-lg bg-[#FDEAEA] p-3 text-center text-[10px] font-bold text-[#C72D34]">Remove this budget? Spend in the category stays; it just stops being tracked against a limit.</p>}
    </form>
  </KitModal>
}
