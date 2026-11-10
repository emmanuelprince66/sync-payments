import { z } from 'zod'

/** Sink's CustomerSchema: only a name and phone are required. */
export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  phone: z.string().trim().min(1, 'Phone number is required').regex(/^\+?[0-9][0-9\s-]{6,17}$/, 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email address').or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).or(z.literal('')),
  dateOfBirth: z.string(),
  address: z.string(),
  addressPhone: z.string(),
  state: z.string(),
  city: z.string(),
})
export type CustomerValues = z.infer<typeof customerSchema>

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]
