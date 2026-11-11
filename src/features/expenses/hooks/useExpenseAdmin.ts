import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useBudgets, useCategorySpend, useDeleteExpense, useRecentExpenseActivity, type Expense } from '@/api/expenses'
import { useBusinessBanks, useCreateExpenseCategory } from '@/api/transactions'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { isPending } from '../approval-items'
import { categorySchema, type CategoryValues } from '../schemas'

/** Categories with what's been spent in each; budgets themselves are managed on the Budgets tab. */
export function useCategoriesManager(onClose: () => void) {
  const money = useFormatMoney()
  const { businessId } = useBusinessBanks()
  const spend = useCategorySpend()
  const budgets = useBudgets()
  const createCategory = useCreateExpenseCategory()
  const categoryForm = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: { name: '' } })

  return {
    loading: spend.isLoading || budgets.isLoading,
    rows: (spend.data ?? []).map(row => {
      const budget = budgets.data?.find(item => item.categoryName === row.name) ?? null
      return { id: row.id, name: row.name, spent: money(row.spent), count: row.count, budgetLabel: budget ? `${money(budget.total)} budget` : 'No budget' }
    }),
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
