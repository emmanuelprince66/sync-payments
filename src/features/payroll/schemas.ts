import { z } from 'zod'

export const EMPLOYMENT_TYPES = ['Salary', 'Contract'] as const

export const employeeSchema = z.object({
  name: z.string().trim().min(2, 'Enter the employee’s name'),
  role: z.string().trim().min(2, 'Enter a role'),
  account: z.string().trim().min(2, 'Enter the bank and account'),
  amount: z.number({ invalid_type_error: 'Enter the gross pay' }).positive('Gross pay must be above 0'),
  type: z.enum(EMPLOYMENT_TYPES),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>
