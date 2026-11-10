import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useBudgets, useCategorySpend, useCreateBudget, useDeleteBudget, useDeleteExpense, useEditBudget, useRecentExpenseActivity, useSaveExpenseSettings, type Budget, type Expense, type ExpenseSettings } from '@/api/expenses'
import { useBusinessBanks, useCreateExpenseCategory, useExpenseCategories } from '@/api/transactions'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { budgetSchema, categorySchema, settingsSchema, type BudgetValues, type CategoryValues, type SettingsValues } from '../schemas'

const YEAR = new Date().getFullYear()

/** Categories and budgets (sink: Budgets, SetCategoryBudgetModal). */
export function useCategoriesManager(onClose: () => void) {
  const money = useFormatMoney()
  const { businessId } = useBusinessBanks()
  const spend = useCategorySpend()
  const budgets = useBudgets()
  const categories = useExpenseCategories()
  const createCategory = useCreateExpenseCategory()
  const createBudget = useCreateBudget()
  const editBudget = useEditBudget()
  const deleteBudget = useDeleteBudget()
  const [editing, setEditing] = useState<Budget | null>(null)

  const categoryForm = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: { name: '' } })
  const budgetForm = useForm<BudgetValues>({ resolver: zodResolver(budgetSchema), defaultValues: { categoryId: '', total: '', months: '12', year: String(YEAR) } })

  const fail = (failure: unknown) => toast.error(errorMessage(failure, 'That did not save. Please try again.'))
  const options = (categories.data ?? []).map(category => ({ value: category.id, label: category.name }))

  return {
    loading: spend.isLoading || budgets.isLoading,
    rows: (spend.data ?? []).map(row => {
      const budget = budgets.data?.find(item => item.categoryName === row.name) ?? null
      return { id: row.id, name: row.name, spent: money(row.spent), count: row.count, budget, budgetLabel: budget ? money(budget.total) : 'No budget' }
    }),
    options,
    years: [YEAR - 1, YEAR, YEAR + 1].map(String),
    categoryForm,
    addCategory: categoryForm.handleSubmit(values => {
      if (!businessId) return
      createCategory.mutate({ businessId, name: values.name }, { onSuccess: () => { toast.success('Category added'); categoryForm.reset() }, onError: fail })
    }),
    addingCategory: createCategory.isPending,
    budgetForm,
    editing,
    startEdit: (budget: Budget, categoryId: string) => { setEditing(budget); budgetForm.reset({ categoryId, total: String(budget.total), months: String(budget.months), year: String(budget.year) }) },
    cancelEdit: () => { setEditing(null); budgetForm.reset({ categoryId: '', total: '', months: '12', year: String(YEAR) }) },
    saveBudget: budgetForm.handleSubmit(values => {
      if (!businessId) return
      const input = { categoryId: values.categoryId, total: Number(values.total), months: Number(values.months), year: Number(values.year) }
      const done = () => { toast.success(editing ? 'Budget updated' : 'Budget created'); setEditing(null); budgetForm.reset({ categoryId: '', total: '', months: '12', year: String(YEAR) }) }
      if (editing) editBudget.mutate({ businessId, budgetId: editing.id, input }, { onSuccess: done, onError: fail })
      else createBudget.mutate({ businessId, input }, { onSuccess: done, onError: fail })
    }),
    savingBudget: createBudget.isPending || editBudget.isPending,
    removeBudget: (budgetId: string) => {
      if (!businessId) return
      deleteBudget.mutate({ businessId, budgetId }, { onSuccess: () => { toast.success('Budget removed'); setEditing(null) }, onError: fail })
    },
    removing: deleteBudget.isPending,
    onClose,
  }
}

/** Limits and approval policy, owner only (sink: expenses/settings). */
export function useExpenseSettingsForm({ settings, onClose }: { settings: ExpenseSettings | null; onClose: () => void }) {
  const { businessId } = useBusinessBanks()
  const save = useSaveExpenseSettings()
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    values: { maxPerTransaction: settings?.maxPerTransaction ?? '', dailyTransferLimit: settings?.dailyTransferLimit ?? '', dailyTransactionLimit: String(settings?.dailyTransactionLimit ?? ''), requireApprovalForAll: settings?.requireApprovalForAll ?? false },
  })
  return {
    register: form.register,
    errors: form.formState.errors,
    onSubmit: form.handleSubmit(values => {
      if (!businessId) return
      save.mutate({ businessId, settings: { maxPerTransaction: values.maxPerTransaction || '0', dailyTransferLimit: values.dailyTransferLimit || '0', dailyTransactionLimit: Number(values.dailyTransactionLimit) || 0, requireApprovalForAll: values.requireApprovalForAll } }, {
        onSuccess: () => { toast.success('Approval rules saved'); onClose() },
        onError: failure => toast.error(errorMessage(failure, 'Could not save the rules')),
      })
    }),
    saving: save.isPending,
  }
}

/** Details dialog: delete with a confirm step. */
export function useExpenseDetails({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const remove = useDeleteExpense()
  const [confirming, setConfirming] = useState(false)
  return {
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
