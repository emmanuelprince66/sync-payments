import { ArrowRight, Check, CreditCard, ReceiptText, ShieldCheck } from 'lucide-react'
import type { Expense } from '@/api/expenses'
import { KitModal, KitMoneyField, KitTextarea } from '@/components/ui/KitExtras'
import { KitField, KitFormDate, KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { useExpenseForm } from '../hooks/useExpenseForm'
import type { ExpenseDraft } from '../hooks/useExpensesPage'

const STEPS = [['1', 'Details'], ['2', 'Approval']]

/** The design's two-step "Submit an expense". */
export function ExpenseForm({ draft, editing, onClose, onDone }: { draft: ExpenseDraft | null; editing: Expense | null; onClose: () => void; onDone: (message: string) => void }) {
  const form = useExpenseForm({ draft, editing, onDone })
  const { symbol } = useBusinessCurrency()

  return <KitModal
    open
    onClose={onClose}
    title={form.isEdit ? 'Edit expense' : 'Submit an expense'}
    description={form.isEdit ? 'Update this expense before it is decided.' : form.fromInvoice ? 'Created from an invoice and ready for review.' : 'Record spend and route it to the right approver.'}
    icon={<CreditCard size={16}/>}
    subheader={<div className="flex items-center gap-3 text-[10px] font-extrabold">
      {STEPS.map(([number, label], index) => <div key={label} className="flex flex-1 items-center gap-2">
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${form.step >= index + 1 ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'}`}>{form.step > index + 1 ? <Check size={12}/> : number}</span>
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
      ? <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <KitField label="Merchant or payee" placeholder="e.g. Delta Air Lines" error={form.errors.name?.message} {...form.register('name')}/>
          <KitMoneyField label="Amount" symbol={symbol} error={form.errors.amount?.message} {...form.register('amount')}/>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <KitSelect label="Category" error={form.errors.categoryId?.message} {...form.register('categoryId')}>
            <option value="">{form.categoriesLoading ? 'Loading categories…' : 'Select a category'}</option>
            {form.categories.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </KitSelect>
          <KitFormDate control={form.control} name="date" label="Expense date" error={form.errors.date?.message}/>
        </div>
        <KitTextarea label="Business purpose" placeholder="What was this expense for?" {...form.register('note')}/>
        <div className="rounded-xl border border-dashed border-secondary/35 bg-accent/50 p-4 text-center opacity-70">
          <ReceiptText size={19} className="mx-auto text-secondary"/>
          <p className="mt-2 text-[11px] font-extrabold">Receipt upload isn't available yet</p>
          <p className="mt-1 text-[9px] text-muted-foreground">Mention the receipt in the business purpose for now.</p>
        </div>
      </div>
      : <div className="flex flex-col gap-5 p-6">
        <div className="rounded-2xl bg-[#F8FAF8] p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Payment summary</p>
          <div className="mt-3 flex items-end justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-extrabold">{form.summary.name}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{form.summary.category} · {form.summary.account}</p></div><p className="shrink-0 text-xl font-extrabold">{form.summary.amount}</p></div>
        </div>
        <div className="rounded-xl border border-[#E7D7AE] bg-[#FFF9EC] p-4"><div className="flex gap-3"><ShieldCheck size={17} className="shrink-0 text-[#A76700]"/><div><p className="text-xs font-extrabold text-foreground">{form.requiresApproval ? 'An approver signs this off' : 'Recorded for your books'}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Your approvers are set by your team's permissions, and each one sees this in their queue. Every action is recorded in the audit trail.</p></div></div></div>
      </div>}
  </KitModal>
}
