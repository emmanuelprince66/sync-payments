import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email or phone number').transform(value => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(50),
})
export type LoginFormInput = z.input<typeof loginSchema>
export type LoginFormOutput = z.output<typeof loginSchema>

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your full name').refine(value => value.split(/\s+/).length >= 2, 'Enter your first and last name'),
  phone: z.string().trim().regex(/^\+?[\d\s-]{10,16}$/, 'Enter a valid phone number').transform(value => value.replace(/[\s-]/g, '')),
  email: z.string().trim().email('Enter a valid email address').transform(value => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(50, 'Password must be less than 50 characters'),
})
export type SignupFormInput = z.input<typeof signupSchema>
export type SignupFormOutput = z.output<typeof signupSchema>

export const businessSchema = z.object({
  name: z.string().trim().min(2, 'Enter your business name'),
  category: z.string().min(1),
  address: z.string().trim().min(5, 'Enter your full business address'),
})
export type BusinessFormValues = z.infer<typeof businessSchema>

/** "Kemi Ada Adeyemi" → { firstname: "Kemi", lastname: "Ada Adeyemi" } for the signup API. */
export const splitName = (name: string) => {
  const [firstname, ...rest] = name.trim().split(/\s+/)
  return { firstname, lastname: rest.join(' ') }
}
