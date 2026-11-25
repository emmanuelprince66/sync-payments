import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { ENTRY_TYPES, entryTypeLabel, useCreateExpense, useExpenseSettings, useUpdateExpense, type EntryType, type Expense } from '@/api/expenses'
import { useBusinessBanks, useCreateExpenseCategory, useExpenseCategories } from '@/api/transactions'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { isoDay } from '@/lib/format'
import { expenseSchema, type ExpenseValues } from '../schemas'
import type { ExpenseDraft } from './useExpensesPage'

const blankLine = { name: '', amount: '', categoryId: '' }

/**
 * Details → approval steps. A draft comes from an invoice; `editing` comes from the expense's details.
 * A new entry may carry several lines (one per category), logged together with one type, date and note.
 * Editing is one line, and also reclassifies: changing the type or category goes up with the edit.
 */
export function useExpenseForm({ draft, editing, onDone }: { draft: ExpenseDraft | null; editing: Expense | null; onDone: (message: string) => void }) {
  const money = useFormatMoney()
  const categories = useExpenseCategories()
  const settings = useExpenseSettings()
  const banks = useBusinessBanks()
  const businessId = banks.businessId
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const [step, setStep] = useState<1 | 2>(1)
  const createCategory = useCreateExpenseCategory()
  // + New category under a line's picker: typed here, saved, then selected on that line.
  const [newCategory, setNewCategory] = useState<{ index: number; value: string } | null>(null)

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    // Continue checks without submitting, so re-check each field as it's corrected.
    mode: 'onTouched',
    defaultValues: {
      entryType: editing?.entryType ?? 'EXPENSE',
      items: [{
        name: editing?.name ?? draft?.merchant ?? '',
        amount: editing ? String(editing.amount) : draft?.amount ? String(draft.amount) : '',
        categoryId: editing?.categoryId ?? '',
      }],
      date: editing?.date || isoDay(new Date()),
      note: editing?.note ?? draft?.note ?? '',
    },
  })
  const lines = useFieldArray({ control: form.control, name: 'items' })
  const [entryType, items] = useWatch({ control: form.control, name: ['entryType', 'items'] })
  const total = (items ?? []).reduce((sum, line) => sum + (Number(line.amount) || 0), 0)
  const categoryName = (id: string) => categories.data?.find(category => category.id === id)?.name ?? ''
  const noun = entryTypeLabel(entryType).toLowerCase()

  const onSubmit = form.handleSubmit(values => {
    const note = values.note.trim() || undefined
    const parsed = values.items.map(line => ({ name: line.name.trim(), categoryId: line.categoryId, amount: Number(line.amount) }))
    const onError = (failure: unknown) => toast.error(errorMessage(failure, `Could not save this ${noun}`))
    if (editing) {
      update.mutate({ id: editing.id, input: { entryType: values.entryType, ...parsed[0], date: values.date, note } }, { onSuccess: () => onDone(`${entryTypeLabel(values.entryType)} updated.`), onError })
      return
    }
    if (!businessId) { toast.error('Select a business first'); return }
    create.mutate({ businessId, input: { entryType: values.entryType, date: values.date, note, items: parsed } }, {
      onSuccess: () => onDone(parsed.length > 1 ? `${parsed.length} items submitted to the approval queue.` : `${entryTypeLabel(values.entryType)} submitted to the approval queue.`),
      onError,
    })
  })

  const expenseAccount = banks.banks.find(bank => bank.isExpenses)

  const addCategory = () => {
    if (!newCategory) return
    const nameValue = newCategory.value.trim()
    const field = `items.${newCategory.index}.categoryId` as const
    if (nameValue.length < 2) { toast.error('Give the category a name.'); return }
    if (!businessId) { toast.error('Select a business first'); return }
    const existing = categories.data?.find(category => category.name.toLowerCase() === nameValue.toLowerCase())
    if (existing) { form.setValue(field, existing.id, { shouldValidate: true }); setNewCategory(null); return }
    createCategory.mutate({ businessId, name: nameValue }, {
      onSuccess: created => {
        if (created.id) form.setValue(field, created.id, { shouldValidate: true })
        toast.success(`Category “${created.name}” added`)
        setNewCategory(null)
      },
      onError: failure => toast.error(errorMessage(failure, 'Could not add the category.')),
    })
  }

  return {
    step,
    isEdit: Boolean(editing),
    fromInvoice: Boolean(draft),
    register: form.register,
    control: form.control,
    errors: form.formState.errors,
    entryType: {
      value: entryType,
      options: ENTRY_TYPES,
      hint: ENTRY_TYPES.find(item => item.value === entryType)?.hint ?? '',
      set: (value: EntryType) => form.setValue('entryType', value, { shouldValidate: form.formState.isSubmitted }),
      noun,
      categoryOptional: entryType === 'TRANSFER',
    },
    lines: {
      rows: lines.fields,
      /** Only a new entry can have more than one line. */
      canAdd: !editing,
      add: () => lines.append({ ...blankLine }),
      remove: (index: number) => { lines.remove(index); setNewCategory(null) },
      total: money(total),
    },
    categories: (categories.data ?? []).map(category => ({ value: category.id, label: category.name })),
    categoriesLoading: categories.isLoading,
    newCategory: {
      openFor: newCategory?.index ?? -1,
      value: newCategory?.value ?? '',
      start: (index: number) => setNewCategory({ index, value: '' }),
      change: (value: string) => setNewCategory(current => (current ? { ...current, value } : current)),
      cancel: () => setNewCategory(null),
      save: addCategory,
      saving: createCategory.isPending,
    },
    summary: {
      type: entryTypeLabel(entryType),
      lines: (items ?? []).map(line => ({ name: line.name || 'Item', category: categoryName(line.categoryId) || (entryType === 'TRANSFER' ? 'No category' : 'Uncategorised'), amount: money(Number(line.amount) || 0) })),
      amount: money(total),
      account: expenseAccount?.account_name || 'Expense records',
    },
    requiresApproval: settings.data?.requireApprovalForAll ?? true,
    next: async () => { if (await form.trigger(undefined, { shouldFocus: true })) setStep(2) },
    back: () => setStep(1),
    onSubmit,
    submitting: create.isPending || update.isPending,
  }
}
