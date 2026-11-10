import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useCreateBranch } from '@/api/branches'
import { ApiError } from '@/lib/api-client'
import { addBranchSchema, type AddBranchValues } from '../schemas'

export function useAddBranchForm(defaultAccount: string, onDone: () => void) {
  const createBranch = useCreateBranch()
  const form = useForm<AddBranchValues>({ resolver: zodResolver(addBranchSchema), values: { branch: '', previousAccount: defaultAccount }, resetOptions: { keepDirtyValues: true } })

  const close = () => { form.reset(); onDone() }

  const submit = form.handleSubmit(values => createBranch.mutate(values, {
    onSuccess: () => { toast.success(`${values.branch} branch account created.`); close() },
    onError: error => { toast.error(error instanceof ApiError ? error.message : 'We could not create this branch. Try again.') },
  }))

  return { form, submit, close, isSubmitting: createBranch.isPending }
}
