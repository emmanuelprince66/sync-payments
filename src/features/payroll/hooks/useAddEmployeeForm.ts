import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useAddEmployee } from '@/api/payroll'
import { employeeSchema, type EmployeeFormValues } from '../schemas'

export function useAddEmployeeForm(onDone: () => void) {
  const addEmployee = useAddEmployee()
  const form = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues: { name: '', role: '', account: '', type: 'Salary' } })

  const close = () => { form.reset(); onDone() }

  const submit = form.handleSubmit(values => addEmployee.mutate({ ...values, status: 'Review' }, {
    onSuccess: () => { toast.success(`${values.name} added to payroll.`); close() },
  }))

  return { form, submit, close, isSubmitting: addEmployee.isPending }
}
