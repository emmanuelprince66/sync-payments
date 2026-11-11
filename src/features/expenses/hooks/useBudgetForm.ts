import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateBudget, useDeleteBudget, useEditBudget } from '@/api/expenses'
import { useBusinessBanks, useExpenseCategories } from '@/api/transactions'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { budgetSchema, type BudgetValues } from '../schemas'
import type { BudgetRow } from './useBudgetsTab'

const YEAR = new Date().getFullYear()
/** sink: SetCategoryBudgetModal's quick-pick durations and year choices. */
export const DURATION_PICKS = [1, 3, 6, 12] as const
const YEARS = [YEAR - 1, YEAR, YEAR + 1].map(String)

const blank = (categoryId = ''): BudgetValues => ({ categoryId, total: '', months: '6', year: String(YEAR) })

/**
 * Create, edit or remove one category budget:
 * POST/PATCH expenses/business/{id}/budgets/[{budget_id}/] { category_id, year, total_budget_amount, duration_months }.
 */
export function useBudgetForm({ open, budget, presetCategoryId, onClose }: { open: boolean; budget: BudgetRow | null; presetCategoryId: string; onClose: () => void }) {
  const money = useFormatMoney()
  const { businessId } = useBusinessBanks()
  const categories = useExpenseCategories(open)
  const create = useCreateBudget()
  const edit = useEditBudget()
  const remove = useDeleteBudget()
  const [confirming, setConfirming] = useState(false)

  const form = useForm<BudgetValues>({ resolver: zodResolver(budgetSchema), defaultValues: blank() })
  const { reset } = form

  useEffect(() => {
    if (!open) return
    reset(budget ? { categoryId: budget.categoryId, total: String(budget.total), months: String(budget.months || 6), year: String(budget.year || YEAR) } : blank(presetCategoryId))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reopening the dialog starts without the delete confirmation
    setConfirming(false)
  }, [open, budget, presetCategoryId, reset])

  const [total, months] = useWatch({ control: form.control, name: ['total', 'months'] })
  const monthly = Number(total) > 0 && Number(months) > 0 ? Number(total) / Number(months) : 0
  const fail = (fallback: string) => (failure: unknown) => toast.error(errorMessage(failure, fallback))

  return {
    form,
    errors: form.formState.errors,
    editing: Boolean(budget),
    /** A budget's category is fixed once set (sink locks the picker the same way). */
    categoryLocked: Boolean(budget),
    categoryOptions: (categories.data ?? []).map(category => ({ value: category.id, label: category.name })),
    categoriesLoading: categories.isLoading,
    years: YEARS,
    months,
    pickMonths: (value: number) => form.setValue('months', String(value), { shouldValidate: true }),
    monthlyLabel: monthly ? money(monthly) : '—',
    submit: form.handleSubmit(values => {
      if (!businessId) return
      const input = { categoryId: values.categoryId, total: Number(values.total), months: Number(values.months), year: Number(values.year) }
      if (budget) edit.mutate({ businessId, budgetId: budget.id, input }, { onSuccess: () => { toast.success('Budget updated successfully'); onClose() }, onError: fail('Error updating budget') })
      else create.mutate({ businessId, input }, { onSuccess: () => { toast.success('Budget created successfully'); onClose() }, onError: fail('Error creating budget') })
    }),
    saving: create.isPending || edit.isPending,
    confirming,
    askRemove: () => setConfirming(true),
    cancelRemove: () => setConfirming(false),
    remove: () => {
      if (!businessId || !budget) return
      remove.mutate({ businessId, budgetId: budget.id }, { onSuccess: () => { toast.success('Budget removed successfully'); onClose() }, onError: fail('Error removing budget') })
    },
    removing: remove.isPending,
  }
}
