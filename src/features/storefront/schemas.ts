import { z } from 'zod'
import { BUSINESS_SECTOR_OPTIONS, CURRENCY_OPTIONS } from '@/api/storefront'

const phone = z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,17}$/, 'Enter a valid phone number, e.g. +2348012345678')

export const storeDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Store name is required').max(250, 'Keep it under 250 characters'),
  sector: z.enum(BUSINESS_SECTOR_OPTIONS, { errorMap: () => ({ message: 'Choose a business sector' }) }),
  tagline: z.string().trim().max(150, 'Keep the tagline under 150 characters'),
  description: z.string().trim().refine(value => value === '' || value.length >= 10, 'Write at least 10 characters'),
  phone,
  whatsapp: z.union([z.literal(''), phone]),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]),
  street: z.string().trim().min(1, 'Street address is required').max(100, 'Keep it under 100 characters'),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(50),
  country: z.string().trim().min(1, 'Country is required').max(50),
  zipCode: z.string().trim().max(12),
  currency: z.enum(CURRENCY_OPTIONS),
})
export type StoreDetailsValues = z.infer<typeof storeDetailsSchema>

/** shop.yourbusiness.com — at least one dot, letters/digits/hyphens per label. */
export const domainSchema = z.string().regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i, 'Enter a valid domain, such as shop.yourbusiness.com')
