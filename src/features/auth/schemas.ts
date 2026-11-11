import { isValidPhoneNumber } from 'libphonenumber-js'
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email or phone number').transform(value => value.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(50),
})
export type LoginFormInput = z.input<typeof loginSchema>
export type LoginFormOutput = z.output<typeof loginSchema>

/** Same message sink-inventory shows for a malformed business phone. */
export const PHONE_FORMAT_HINT = 'Enter the phone number with its country code, e.g. +234 803 123 4567.'

/** Sign-up fields, rules and messages copied from sink-inventory's useSignUpForm. */
export const signupSchema = z
  .object({
    firstname: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    lastname: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .refine(value => isValidPhoneNumber(value), { message: 'Invalid phone number' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(50, { message: 'Password must be less than 50 characters' }),
    confirmPassword: z.string().min(8, { message: 'Please confirm your password.' }),
    // Optional. Backend field name `referal` (sic).
    referal: z.string().trim().max(50, 'Referral code looks too long.').optional(),
  })
  .refine(data => data.password === data.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })
export type SignupFormValues = z.infer<typeof signupSchema>

/** Business-creation fields, rules and messages copied from sink-inventory's useBusinessHook. */
export const businessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  type: z.string().min(1, 'Business type is required'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  state: z.string().min(1, 'State/Province is required'),
  city: z.string().min(1, 'City/Town is required'),
  street: z.string().min(1, 'Street is required'),
  phone: z.string().refine(value => !value || isValidPhoneNumber(value), PHONE_FORMAT_HINT).optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  delivery_days: z.array(z.string()),
})
export type BusinessFormValues = z.infer<typeof businessSchema>
