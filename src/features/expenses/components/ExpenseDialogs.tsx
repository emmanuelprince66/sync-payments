import { History, Pencil, Plus, Settings2, Tag, Trash2 } from 'lucide-react'
import type { Expense, ExpenseSettings } from '@/api/expenses'
import { formatActivityDate } from '@/api/http'
import { KitEmpty, KitModal, KitMoneyField } from '@/components/ui/KitExtras'
import { KitField, KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { expenseStatusLabel } from '../format'
import { useAuditTrail, useCategoriesManager, useExpenseDetails, useExpenseSettingsForm } from '../hooks/useExpenseAdmin'

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-border py-3 text-[11px] last:border-0"><span className="shrink-0 text-muted-foreground">{label}</span><span className="text-right font-extrabold [overflow-wrap:anywhere]">{value || '—'}</span></div>
}

export function ExpenseDetailsModal({ expense, canEdit, onClose, onEdit }: { expense: Expense | null; canEdit: boolean; onClose: () => void; onEdit: (expense: Expense) => void }) {
  const money = useFormatMoney()
  const details = useExpenseDetails({ expense, onClose })
  return <KitModal
    open={Boolean(expense)}
    onClose={onClose}
    title={expense?.name || 'Expense'}
    description={expense?.reference}
    panelClassName="max-w-md"
    footer={expense && canEdit && (details.confirming
      ? <><KitButton variant="secondary" onClick={details.cancelDelete}>Keep it</KitButton><button type="button" disabled={details.deleting} onClick={details.confirmDelete} className="rounded-lg border border-[#EC1B24]/30 px-4 py-2.5 text-xs font-extrabold text-[#C72D34] hover:bg-[#FDEAEA] disabled:opacity-50">{details.deleting ? 'Deleting…' : 'Yes, delete'}</button></>
      : <><button type="button" onClick={details.askDelete} className="inline-flex items-center gap-2 rounded-lg border border-[#EC1B24]/30 px-4 py-2.5 text-xs font-extrabold text-[#C72D34] hover:bg-[#FDEAEA]"><Trash2 size={14}/> Delete</button><KitButton onClick={() => onEdit(expense)}><Pencil size={14}/> Edit</KitButton></>)}
  >
    {expense && <>
      <p className="text-center text-3xl font-extrabold [overflow-wrap:anywhere]">{money(expense.amount)}</p>
      <div className="mt-4">
        <InfoRow label="Status" value={expenseStatusLabel(expense.status)}/>
        <InfoRow label="Category" value={expense.category}/>
        <InfoRow label="Owner" value={expense.owner}/>
        <InfoRow label="Date" value={expense.date}/>
        {expense.note && <InfoRow label="Business purpose" value={expense.note}/>}
        {expense.approvedBy && <InfoRow label="Approved by" value={expense.approvedBy}/>}
        {expense.rejectedBy && <InfoRow label="Rejected by" value={expense.rejectedBy}/>}
        {expense.rejectionReason && <InfoRow label="Reason" value={expense.rejectionReason}/>}
      </div>
      {details.confirming && <p className="mt-3 rounded-lg bg-[#FDEAEA] p-3 text-center text-[10px] font-bold text-[#C72D34]">Delete this expense? This can't be undone.</p>}
    </>}
  </KitModal>
}

export function AuditTrailModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const audit = useAuditTrail(open)
  return <KitModal open={open} onClose={onClose} title="Audit trail" description="Recent expense activity across this business." icon={<History size={16}/>} panelClassName="max-w-md">
    {audit.loading
      ? <ListSkeleton rows={4} rowClassName="flex items-center gap-4 border-b border-border py-3 last:border-0"/>
      : audit.rows.length === 0
        ? <KitEmpty title="Nothing recorded yet" className="py-6"/>
        : <div className="divide-y divide-border">{audit.rows.map(row => <div key={row.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0"><p className="truncate text-xs font-extrabold">{row.name || row.category}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.by || 'Team member'} · {expenseStatusLabel(row.status)} · {formatActivityDate(row.createdAt)}</p></div>
          <p className="shrink-0 text-xs font-extrabold">{row.amountLabel}</p>
        </div>)}</div>}
  </KitModal>
}

export function CategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const manager = useCategoriesManager(onClose)
  const { symbol } = useBusinessCurrency()
  const budgetErrors = manager.budgetForm.formState.errors
  return <KitModal open={open} onClose={onClose} title="Manage categories" description="Categories, and the budgets spend is tracked against." icon={<Tag size={16}/>}>
    <form onSubmit={manager.addCategory} noValidate className="flex items-start gap-2">
      <KitField label="New category" placeholder="e.g. Fuel" className="flex-1" error={manager.categoryForm.formState.errors.name?.message} {...manager.categoryForm.register('name')}/>
      <KitButton type="submit" className="mt-[22px] h-11 shrink-0" loading={manager.addingCategory}><Plus size={13}/> Add</KitButton>
    </form>

    <div className="mt-5 divide-y divide-border rounded-xl border border-border">
      {manager.loading
        ? <ListSkeleton rows={3} rowClassName="flex items-center gap-4 p-3"/>
        : manager.rows.length === 0
          ? <KitEmpty title="No categories yet" note="Add your first one above." className="py-6"/>
          : manager.rows.map(row => <div key={row.id || row.name} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{row.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{row.spent} spent · {row.count} {row.count === 1 ? 'expense' : 'expenses'}</p></div>
            <p className="shrink-0 text-[10px] font-bold text-foreground/70">{row.budgetLabel}</p>
            {row.budget && <>
              <button type="button" aria-label={`Edit ${row.name} budget`} onClick={() => row.budget && manager.startEdit(row.budget, row.id)} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Pencil size={13}/></button>
              <button type="button" aria-label={`Remove ${row.name} budget`} disabled={manager.removing} onClick={() => row.budget && manager.removeBudget(row.budget.id)} className="shrink-0 rounded-md p-1.5 text-[#C72D34] hover:bg-[#FDEAEA]"><Trash2 size={13}/></button>
            </>}
          </div>)}
    </div>

    <form onSubmit={manager.saveBudget} noValidate className="mt-5 flex flex-col gap-4 rounded-xl bg-[#F8FAF8] p-4">
      <p className="text-xs font-extrabold">{manager.editing ? `Edit ${manager.editing.categoryName} budget` : 'Set a budget'}</p>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <KitSelect label="Category" error={budgetErrors.categoryId?.message} {...manager.budgetForm.register('categoryId')}>
          <option value="">Select a category</option>
          {manager.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </KitSelect>
        <KitMoneyField label="Total budget" symbol={symbol} error={budgetErrors.total?.message} {...manager.budgetForm.register('total')}/>
        <KitField label="Duration (months)" inputMode="numeric" error={budgetErrors.months?.message} {...manager.budgetForm.register('months')}/>
        <KitSelect label="Year" error={budgetErrors.year?.message} {...manager.budgetForm.register('year')}>
          {manager.years.map(year => <option key={year} value={year}>{year}</option>)}
        </KitSelect>
      </div>
      <div className="flex justify-end gap-2">
        {manager.editing && <KitButton variant="secondary" onClick={manager.cancelEdit}>Cancel</KitButton>}
        <KitButton type="submit" loading={manager.savingBudget}>{manager.editing ? 'Save budget' : 'Create budget'}</KitButton>
      </div>
    </form>
  </KitModal>
}

export function ExpenseSettingsModal({ open, settings, onClose }: { open: boolean; settings: ExpenseSettings | null; onClose: () => void }) {
  const form = useExpenseSettingsForm({ settings, onClose })
  const { symbol } = useBusinessCurrency()
  return <KitModal
    open={open}
    onClose={onClose}
    title="Approval rules"
    description="Leave a limit at 0 to not enforce it."
    icon={<Settings2 size={16}/>}
    panelClassName="max-w-md"
    footer={<><KitButton variant="secondary" onClick={onClose}>Cancel</KitButton><KitButton onClick={form.onSubmit} loading={form.saving}>Save rules</KitButton></>}
  >
    <div className="flex flex-col gap-4">
      <KitMoneyField label="Most per transaction" symbol={symbol} error={form.errors.maxPerTransaction?.message} {...form.register('maxPerTransaction')}/>
      <KitMoneyField label="Most per day" symbol={symbol} error={form.errors.dailyTransferLimit?.message} {...form.register('dailyTransferLimit')}/>
      <KitField label="Transfers per day" inputMode="numeric" error={form.errors.dailyTransactionLimit?.message} {...form.register('dailyTransactionLimit')}/>
      <label className="flex items-center gap-3 rounded-xl bg-[#F8FAF8] p-4 text-xs font-bold"><input type="checkbox" className="h-4 w-4 accent-[#529661]" {...form.register('requireApprovalForAll')}/> Every transfer needs an approver</label>
    </div>
  </KitModal>
}
