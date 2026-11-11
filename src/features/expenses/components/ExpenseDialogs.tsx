import { Check, History, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import type { Expense } from '@/api/expenses'
import { formatActivityDate } from '@/api/http'
import { KitEmpty, KitModal } from '@/components/ui/KitExtras'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { expenseStatusLabel } from '../format'
import { useAuditTrail, useCategoriesManager, useExpenseDetails } from '../hooks/useExpenseAdmin'

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-border py-3 text-[11px] last:border-0"><span className="shrink-0 text-muted-foreground">{label}</span><span className="text-right font-extrabold [overflow-wrap:anywhere]">{value || '—'}</span></div>
}

export function ExpenseDetailsModal({ expense, canEdit, onClose, onEdit, onReview }: { expense: Expense | null; canEdit: boolean; onClose: () => void; onEdit: (expense: Expense) => void; onReview: (expense: Expense) => void }) {
  const money = useFormatMoney()
  const details = useExpenseDetails({ expense, onClose })
  return <KitModal
    open={Boolean(expense)}
    onClose={onClose}
    title={expense?.name || 'Expense'}
    description={expense?.reference}
    panelClassName="max-w-md"
    footer={expense && details.canReview ? <><KitButton variant="secondary" onClick={onClose}>Close</KitButton><KitButton onClick={() => onReview(expense)}><Check size={14}/> Review approval</KitButton></> : expense && canEdit && (details.confirming
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

export function CategoriesModal({ open, onClose, onManageBudgets }: { open: boolean; onClose: () => void; onManageBudgets: () => void }) {
  const manager = useCategoriesManager(onClose)
  return <KitModal open={open} onClose={onClose} title="Manage categories" description="Every expense needs a category. Budgets are set per category." icon={<Tag size={16}/>}>
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
          </div>)}
    </div>

    <button type="button" onClick={onManageBudgets} className="mt-4 text-[10px] font-extrabold text-secondary hover:underline">Set and track budgets in the Budgets tab</button>
  </KitModal>
}
