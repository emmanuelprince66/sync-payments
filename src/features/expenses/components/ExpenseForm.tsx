import { ArrowRight, Check, CreditCard, Plus, ReceiptText, ShieldCheck, X } from 'lucide-react'
import type { Expense } from '@/api/expenses'
import { KitModal, KitMoneyField, KitTextarea } from '@/components/ui/KitExtras'
import { KitField, KitFormDate, KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { cn } from '@/lib/cn'
import { useExpenseForm } from '../hooks/useExpenseForm'
import type { ExpenseDraft } from '../hooks/useExpensesPage'

const STEPS = [['1', 'Details'], ['2', 'Approval']]

type Form = ReturnType<typeof useExpenseForm>

/** Expense / Purchase / Transfer, with what each one counts toward. */
export function EntryTypePicker({ value, options, hint, onChange }: { value: string; options: Form['entryType']['options']; hint: string; onChange: (value: Form['entryType']['value']) => void }) {
  return <div>
    <p className="mb-1.5 text-[10px] font-extrabold">Type</p>
    <div role="radiogroup" aria-label="Entry type" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {options.map(option => {
        const active = option.value === value
        return <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(option.value)} className={cn('h-9 rounded-lg text-[11px] font-extrabold transition-colors', active ? 'bg-white text-brand shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{option.label}</button>
      })}
    </div>
    <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">{hint}</p>
  </div>
}

function CategoryPicker({ form, index }: { form: Form; index: number }) {
  const optional = form.entryType.categoryOptional
  const adding = form.newCategory.openFor === index
  return <div className="min-w-0">
    <KitSelect label={optional ? 'Category (optional)' : 'Category'} error={form.errors.items?.[index]?.categoryId?.message} {...form.register(`items.${index}.categoryId`)}>
      <option value="">{form.categoriesLoading ? 'Loading categories…' : optional ? 'No category' : 'Select a category'}</option>
      {form.categories.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </KitSelect>
    {/* Not a nested <form>: Enter saves the category without submitting the entry. */}
    {adding
      ? <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3">
        <input autoFocus value={form.newCategory.value} onChange={event => form.newCategory.change(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); form.newCategory.save() } if (event.key === 'Escape') form.newCategory.cancel() }} placeholder="e.g. Fuel, Raw materials" aria-label="New category name" className="h-10 w-full rounded-lg border border-border bg-white px-3 text-xs font-bold outline-none focus:border-secondary"/>
        <div className="flex gap-2"><KitButton variant="secondary" onClick={form.newCategory.cancel} className="h-9 flex-1">Cancel</KitButton><KitButton onClick={form.newCategory.save} loading={form.newCategory.saving} className="h-9 flex-1">Add category</KitButton></div>
      </div>
      : <button type="button" onClick={() => form.newCategory.start(index)} className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-brand hover:underline"><Plus size={13}/>New category</button>}
  </div>
}

/** The design's two-step "Submit an expense", now for any entry type and several lines at once. */
export function ExpenseForm({ draft, editing, onClose, onDone }: { draft: ExpenseDraft | null; editing: Expense | null; onClose: () => void; onDone: (message: string) => void }) {
  const form = useExpenseForm({ draft, editing, onDone })
  const { symbol } = useBusinessCurrency()
  const several = form.lines.rows.length > 1

  return <KitModal
    open
    onClose={onClose}
    title={form.isEdit ? `Edit ${form.entryType.noun}` : 'Record spend'}
    description={form.isEdit ? 'Update or reclassify this entry before it is decided.' : form.fromInvoice ? 'Created from an invoice and ready for review.' : 'Log an expense, a stock purchase or a transfer, and route it to the right approver.'}
    icon={<CreditCard size={16}/>}
    subheader={<div className="flex items-center gap-3 text-[10px] font-extrabold">
      {STEPS.map(([number, label], index) => <div key={label} className="flex flex-1 items-center gap-2">
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${form.step >= index + 1 ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>{form.step > index + 1 ? <Check size={12}/> : number}</span>
        <span className={form.step >= index + 1 ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        {index === 0 && <span className="ml-auto h-px flex-1 bg-border"/>}
      </div>)}
    </div>}
    bodyClassName=""
    footer={<>
      <KitButton variant="secondary" onClick={form.step === 1 ? onClose : form.back}>{form.step === 1 ? 'Cancel' : 'Back'}</KitButton>
      {form.step === 1
        ? <KitButton onClick={() => void form.next()}>Continue to approval <ArrowRight size={14}/></KitButton>
        : <KitButton onClick={form.onSubmit} loading={form.submitting}>{form.isEdit ? 'Save changes' : 'Submit for approval'} <ArrowRight size={14}/></KitButton>}
    </>}
  >
    {form.step === 1
      ? <div className="flex flex-col gap-5 p-6">
        <EntryTypePicker value={form.entryType.value} options={form.entryType.options} hint={form.entryType.hint} onChange={form.entryType.set}/>

        <div className="flex flex-col gap-3">
          {form.lines.rows.map((row, index) => <div key={row.id} className={cn('flex flex-col gap-4', several && 'rounded-xl border border-border p-4')}>
            {several && <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Item {index + 1}</p>
              <button type="button" aria-label={`Remove item ${index + 1}`} onClick={() => form.lines.remove(index)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-[#FFF0F0] hover:text-[#C72D34]"><X size={14}/></button>
            </div>}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <KitField label={form.entryType.value === 'PURCHASE' ? 'Item or supplier' : 'Merchant or payee'} placeholder={form.entryType.value === 'PURCHASE' ? 'e.g. Flour, 20 bags' : 'e.g. Delta Air Lines'} error={form.errors.items?.[index]?.name?.message} {...form.register(`items.${index}.name`)}/>
              <KitMoneyField label="Amount" symbol={symbol} error={form.errors.items?.[index]?.amount?.message} {...form.register(`items.${index}.amount`)}/>
            </div>
            <CategoryPicker form={form} index={index}/>
          </div>)}
          {form.lines.canAdd && <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={form.lines.add} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-secondary/50 px-3 py-2 text-[11px] font-extrabold text-brand hover:bg-accent"><Plus size={13}/>Add another item</button>
            {several && <p className="text-xs font-extrabold">Total {form.lines.total}</p>}
          </div>}
        </div>

        <KitFormDate control={form.control} name="date" label="Date" error={form.errors.date?.message}/>
        <KitTextarea label={several ? 'Note (shared by every item)' : 'Business purpose'} placeholder="What was this for?" {...form.register('note')}/>
        <div className="rounded-xl border border-dashed border-secondary/35 bg-accent/50 p-4 text-center opacity-70">
          <ReceiptText size={19} className="mx-auto text-brand"/>
          <p className="mt-2 text-[11px] font-extrabold">Receipt upload isn't available yet</p>
          <p className="mt-1 text-[9px] text-muted-foreground">Mention the receipt in the note for now.</p>
        </div>
      </div>
      : <div className="flex flex-col gap-5 p-6">
        <div className="rounded-2xl bg-[#FAFAFA] p-4">
          <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Summary</p><span className="rounded-full bg-accent px-2.5 py-1 text-[9px] font-extrabold text-brand">{form.summary.type}</span></div>
          <div className="mt-3 flex flex-col gap-3">
            {form.summary.lines.map((line, index) => <div key={index} className="flex items-end justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-extrabold">{line.name}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{line.category} · {form.summary.account}</p></div><p className="shrink-0 text-sm font-extrabold">{line.amount}</p></div>)}
          </div>
          {form.summary.lines.length > 1 && <div className="mt-3 flex justify-between gap-3 border-t border-border pt-3"><span className="text-xs font-extrabold">Total</span><span className="text-xl font-extrabold">{form.summary.amount}</span></div>}
        </div>
        <div className="rounded-xl border border-[#E7D7AE] bg-[#FFF9EC] p-4"><div className="flex gap-3"><ShieldCheck size={17} className="shrink-0 text-[#8F5F00]"/><div><p className="text-xs font-extrabold text-foreground">{form.requiresApproval ? 'An approver signs this off' : 'Recorded for your books'}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Your approvers are set by your team's permissions, and each one sees this in their queue. Every action is recorded in the audit trail.</p></div></div></div>
      </div>}
  </KitModal>
}
