import { toast } from 'sonner'
import { useReconciliation, useResolveException, useRunReconciliation } from '@/api/reconciliation'
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useFormatMoney } from '@/hooks/useFormatMoney'

export function useReconciliationPage() {
  const money = useFormatMoney()
  const dates = useDateRangeFilter()
  const query = useReconciliation({ startDate: dates.startDate, endDate: dates.endDate })
  const resolveMutation = useResolveException()
  const runMutation = useRunReconciliation()

  return {
    money,
    dateRange: dates.range,
    setDateRange: dates.setRange,
    data: query.data,
    isLoading: query.isLoading,
    isRunning: runMutation.isPending,
    resolvingId: resolveMutation.isPending ? resolveMutation.variables : null,
    resolve: (id: string) => resolveMutation.mutate(id, { onSuccess: () => toast.success(`${id} marked as resolved.`) }),
    run: () => runMutation.mutate(undefined, {
      onSuccess: ({ matched }) => toast.success(matched ? `Reconciliation complete: ${matched} more item${matched === 1 ? '' : 's'} matched.` : 'Reconciliation complete: nothing new to match.'),
    }),
  }
}
