import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateExpense, useExpenseSettings, useUpdateExpense, type Expense } from '@/api/expenses'
import { useBusinessBanks, useExpenseCategories } from '@/api/transactions'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { isoDay } from '@/lib/format'
import { expenseSchema, type ExpenseValues } from '../schemas'
import type { ExpenseDraft } from './useExpensesPage'

/** Details → approval steps. A draft comes from an invoice; `editing` comes from the expense's details. */
export function useExpenseForm({ draft, editing, onDone }: { draft: ExpenseDraft | null; editing: Expense | null; onDone: (message: string) => void }) {
  const money = useFormatMoney()
  const categories = useExpenseCategories()
  const settings = useExpenseSettings()
  const banks = useBusinessBanks()
  const businessId = banks.businessId
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const [step, setStep] = useState<1 | 2>(1)

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: editing?.name ?? draft?.merchant ?? '',
      amount: editing ? String(editing.amount) : draft?.amount ? String(draft.amount) : '',
      categoryId: editing?.categoryId ?? '',
      date: editing?.date || isoDay(new Date()),
      note: editing?.note ?? draft?.note ?? '',
    },
  })
  const [name, amount, categoryId] = useWatch({ control: form.control, name: ['name', 'amount', 'categoryId'] })

  const onSubmit = form.handleSubmit(values => {
    const input = { name: values.name, categoryId: values.categoryId, amount: Number(values.amount), date: values.date, note: values.note.trim() || undefined }
    const onError = (failure: unknown) => toast.error(errorMessage(failure, 'Could not save this expense'))
    if (editing) {
      update.mutate({ id: editing.id, input }, { onSuccess: () => onDone('Expense updated.'), onError })
      return
    }
    if (!businessId) { toast.error('Select a business first'); return }
    create.mutate({ businessId, input }, { onSuccess: () => onDone('Expense submitted to the approval queue.'), onError })
  })

  const expenseAccount = banks.banks.find(bank => bank.isExpenses)

  return {
    step,
    isEdit: Boolean(editing),
    fromInvoice: Boolean(draft),
    register: form.register,
    control: form.control,
    errors: form.formState.errors,
    categories: (categories.data ?? []).map(category => ({ value: category.id, label: category.name })),
    categoriesLoading: categories.isLoading,
    summary: {
      name: name || 'Business expense',
      amount: money(Number(amount) || 0),
      category: categories.data?.find(category => category.id === categoryId)?.name ?? 'Uncategorised',
      account: expenseAccount?.account_name || 'Expense records',
    },
    requiresApproval: settings.data?.requireApprovalForAll ?? true,
    next: async () => { if (await form.trigger(['name', 'amount', 'categoryId', 'date'])) setStep(2) },
    back: () => setStep(1),
    onSubmit,
    submitting: create.isPending || update.isPending,
  }
}
