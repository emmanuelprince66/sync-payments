import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { addEmployee, getPayroll } from './sample/payroll'

export { PAYROLL_RATES } from './sample/payroll'
export type { Employee, PayrollData, PayrollTask } from './sample/payroll'

export const usePayroll = () => useQuery({ queryKey: queryKeys.payroll, queryFn: getPayroll })

export const useAddEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payroll }),
  })
}
