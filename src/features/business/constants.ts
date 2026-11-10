/** Business types offered by Sync360 (same list as sink-inventory's useBusinessHook). */
export const BUSINESS_TYPES = [
  'Food & Restaurant',
  'Beauty & Personal Care',
  'Book & Stationery',
  'Minimart & Retail',
  'Electronics & Gadget',
  'Laundry',
  'Salon Business',
  'Pharmacy & Health Products',
  'Home & Furniture',
  'Construction Material & Suppliers',
  'Logistics & Others',
] as const

/** Currency codes the backend accepts (sink-inventory's list, most common first). */
export const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'JPY', 'CHF', 'NZD', 'CNY', 'INR', 'RUB', 'BRL', 'MXN', 'SGD', 'HKD', 'SEK'] as const

export const DEFAULT_COUNTRY = 'Nigeria'

/** Logo rules from sink-inventory: JPG, PNG or WebP up to 5 MB. */
export const LOGO_MAX_MB = 5
export const LOGO_ACCEPT = 'image/jpeg,image/png,image/webp'
