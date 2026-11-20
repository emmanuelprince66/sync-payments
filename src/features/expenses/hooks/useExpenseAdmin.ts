import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useBudgets, useCategorySpend, useDeleteExpense, useRecentExpenseActivity, type Expense } from '@/api/expenses'
import { useBusinessBanks, useCreateExpenseCategory, useDeleteExpenseCategory, useExpenseCategories, useRenameExpenseCategory } from '@/api/transactions'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { isPending } from '../approval-items'
import { categorySchema, type CategoryValues } from '../schemas'

/**
 * Manage categories (sink's Categories › Expenses): every expense category, with what's been spent in it
 * and its budget; add, rename and delete. The list is the categories themselves (category/business/{id}/
 * ?type=EXPENSES), so a new category shows before anything is spent in it. Budgets live on the Budgets tab.
 */
export function useCategoriesManager(onClose: () => void) {
  const money = useFormatMoney()
  const { businessId } = useBusinessBanks()
  const categories = useExpenseCategories()
  const spend = useCategorySpend()
  const budgets = useBudgets()
  const createCategory = useCreateExpenseCategory()
  const rename = useRenameExpenseCategory()
  const remove = useDeleteExpenseCategory()
  const categoryForm = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: { name: '' } })
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  return {
    loading: categories.isLoading,
    rows: (categories.data ?? []).map(category => {
      const spent = spend.data?.find(item => item.id === category.id)
      const budget = budgets.data?.find(item => item.categoryId === category.id) ?? null
      return { id: category.id, name: category.name, spent: money(spent?.spent ?? 0), count: spent?.count ?? 0, budgetLabel: budget ? `${money(budget.total)} budget` : 'No budget' }
    }).sort((a, b) => a.name.localeCompare(b.name)),
    editing,
    startRename: (id: string, name: string) => { setDeleting(null); setEditing({ id, name }) },
    changeRename: (name: string) => setEditing(current => (current ? { ...current, name } : current)),
    cancelRename: () => setEditing(null),
    renaming: rename.isPending,
    saveRename: () => {
      if (!editing) return
      const name = editing.name.trim()
      if (name.length < 2) return void toast.error('Give the category a name.')
      rename.mutate({ id: editing.id, name }, {
        onSuccess: () => { toast.success('Category renamed'); setEditing(null) },
        onError: failure => toast.error(errorMessage(failure, 'Could not rename the category.')),
      })
    },
    deleting,
    askDelete: (id: string) => { setEditing(null); setDeleting(id) },
    cancelDelete: () => setDeleting(null),
    removing: remove.isPending,
    confirmDelete: () => {
      if (!deleting) return
      remove.mutate(deleting, {
        onSuccess: () => { toast.success('Category deleted'); setDeleting(null) },
        onError: failure => toast.error(errorMessage(failure, 'Could not delete the category. It may still have expenses or a budget.')),
      })
    },
    categoryForm,
    addCategory: categoryForm.handleSubmit(values => {
      if (!businessId) return
      createCategory.mutate({ businessId, name: values.name }, {
        onSuccess: () => { toast.success('Category added'); categoryForm.reset() },
        onError: failure => toast.error(errorMessage(failure, 'That did not save. Please try again.')),
      })
    }),
    addingCategory: createCategory.isPending,
    onClose,
  }
}

/** Details dialog: delete with a confirm step. */
export function useExpenseDetails({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const remove = useDeleteExpense()
  const [confirming, setConfirming] = useState(false)
  return {
    /** Pending and this person may decide it: the backend's can_current_user_approve. */
    canReview: Boolean(expense && expense.canApprove && isPending(expense.status)),
    confirming,
    askDelete: () => setConfirming(true),
    cancelDelete: () => setConfirming(false),
    confirmDelete: () => {
      if (!expense) return
      remove.mutate(expense.id, {
        onSuccess: () => { toast.success('Expense deleted'); setConfirming(false); onClose() },
        onError: failure => toast.error(errorMessage(failure, 'Could not delete this expense')),
      })
    },
    deleting: remove.isPending,
  }
}

/** Audit trail: the business's recent expense activity. */
export function useAuditTrail(open: boolean) {
  const money = useFormatMoney()
  const activity = useRecentExpenseActivity(open)
  return { loading: activity.isLoading, rows: (activity.data ?? []).map(row => ({ ...row, amountLabel: money(row.amount) })) }
}
