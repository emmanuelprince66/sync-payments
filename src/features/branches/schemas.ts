import { z } from 'zod'

export const addBranchSchema = z.object({
  branch: z.string().trim().min(2, 'Enter the branch name'),
  previousAccount: z.string().trim().regex(/^\d{10}$/, 'Enter a 10-digit account number'),
})

export type AddBranchValues = z.infer<typeof addBranchSchema>
