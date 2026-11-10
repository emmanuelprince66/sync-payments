import { z } from 'zod'

const phonePattern = /^\+?[\d\s-]{10,17}$/

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2, 'Enter your business name'),
  type: z.string().min(1, 'Choose a business type'),
  currency: z.string().min(1, 'Choose a currency'),
  country: z.string().trim().min(1, 'Enter the country'),
  state: z.string().min(1, 'Choose a state'),
  city: z.string().trim().min(1, 'Enter the city or town'),
  street: z.string().trim().min(3, 'Enter the street address'),
  phone: z.string().trim().refine(value => !value || phonePattern.test(value), 'Enter a valid phone number, e.g. 0803 245 7791'),
  email: z.string().trim().refine(value => !value || z.string().email().safeParse(value).success, 'Enter a valid email address'),
})

export type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>

/**
 * Sync360 stores phone numbers in international format (sink-inventory sends E.164).
 * "0803 245 7791" → "+2348032457791"; numbers already in +/234 form are kept.
 */
export const toE164 = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, '')
  if (!digits) return ''
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`
  return digits
}
