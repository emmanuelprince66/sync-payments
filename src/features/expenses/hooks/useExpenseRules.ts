import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useExpensePermissions, useExpenseSettings, useSaveExpenseSettings } from '@/api/expenses'
import { useBusinessBanks } from '@/api/transactions'
import { settingsSchema, type SettingsValues } from '../schemas'

const shown = (value: string | number | undefined) => (value === undefined || value === '' ? '' : String(Number(value) || 0))

/**
 * The business's expense ceilings and approval policy (sink: settings/expense-governance):
 * GET/PATCH expenses/settings/{business_id}/. Owner-writable; 0 means "not enforced", not "blocked".
 */
export function useExpenseRules() {
  const { isOwner } = useExpensePermissions()
  const { businessId } = useBusinessBanks()
  const settings = useExpenseSettings()
  const save = useSaveExpenseSettings()

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    // Seeded from the server rather than held as the source of truth, so a refetch after saving doesn't fight the screen.
    values: settings.data ? { maxPerTransaction: shown(settings.data.maxPerTransaction), dailyTransferLimit: shown(settings.data.dailyTransferLimit), dailyTransactionLimit: String(settings.data.dailyTransactionLimit ?? 0), requireApprovalForAll: settings.data.requireApprovalForAll } : undefined,
    defaultValues: { maxPerTransaction: '', dailyTransferLimit: '', dailyTransactionLimit: '', requireApprovalForAll: false },
  })
  const requireApproval = useWatch({ control: form.control, name: 'requireApprovalForAll' })

  return {
    isOwner,
    loading: settings.isLoading && !settings.data,
    form,
    errors: form.formState.errors,
    requireApproval,
    setRequireApproval: (value: boolean) => form.setValue('requireApprovalForAll', value, { shouldDirty: true }),
    submit: form.handleSubmit(values => {
      if (!businessId) return
      // Sent as fixed decimals: the API takes decimal strings, and "" has to arrive as 0.
      save.mutate({ businessId, settings: { maxPerTransaction: (Number(values.maxPerTransaction) || 0).toFixed(2), dailyTransferLimit: (Number(values.dailyTransferLimit) || 0).toFixed(2), dailyTransactionLimit: Number(values.dailyTransactionLimit) || 0, requireApprovalForAll: values.requireApprovalForAll } }, {
        onSuccess: () => toast.success('Spending controls updated'),
        onError: failure => toast.error(errorMessage(failure, 'Could not save the limits')),
      })
    }),
    saving: save.isPending,
  }
}
