import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { getReconciliation, resolveException, runReconciliation, type ReconciliationRange } from './sample/reconciliation'

export type { ReconciliationData, ReconciliationException } from './sample/reconciliation'

export const useReconciliation = (range: ReconciliationRange) => useQuery({ queryKey: [...queryKeys.reconciliation, range], queryFn: () => getReconciliation(range), placeholderData: keepPreviousData })

export const useResolveException = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: resolveException, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reconciliation }) })
}

export const useRunReconciliation = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: runReconciliation, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reconciliation }) })
}
