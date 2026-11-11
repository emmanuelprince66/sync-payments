import type { IconName } from '@/components/ui/Icon'

export type AuthStage = 'access' | 'otp' | 'business' | 'kyc'
export type AccessMode = 'login' | 'signup'

/** Onboarding stages shown in the "Account setup · Step x of 3" bar. */
export const SETUP_STAGES: AuthStage[] = ['otp', 'business', 'kyc']

/** URL segment after /signup/ → stage. */
export const STEP_TO_STAGE: Record<string, AuthStage> = { verify: 'otp', business: 'business', kyc: 'kyc' }

export const OTP_LENGTH = 6
export const RESEND_SECONDS = 28
export const SLIDE_INTERVAL_MS = 4500

export const AUTH_SLIDES: { label: string; title: string; text: string; icon: IconName }[] = [
  { label: 'Collections', title: 'Get paid in one business account.', text: 'Take transfers and terminal payments, and see every one as it lands.', icon: 'bank' },
  { label: 'Payments & approvals', title: 'Send money with the right sign-off.', text: 'Transfers, expenses and payroll wait for approval before funds move.', icon: 'send' },
  { label: 'Reconciliation', title: 'Know where every naira went.', text: 'Match collections to settlements and export statements in a click.', icon: 'chart' },
]

export const KYC_BENEFITS = ['Higher withdrawal limits', 'More terminals and sub-accounts', 'Priority payment settlements']

/** Currency codes in sink-inventory's order (its dropdown shows the code). */
export const SIGNUP_CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'INR', 'RUB', 'BRL', 'ZAR', 'MXN', 'SGD', 'HKD', 'SEK', 'KES', 'GHS'] as const

/** Delivery days enum (backend's 7 weekday values) with sink-inventory's short labels. */
export const DELIVERY_DAYS = [
  { value: 'MONDAY', short: 'Mon' },
  { value: 'TUESDAY', short: 'Tue' },
  { value: 'WEDNESDAY', short: 'Wed' },
  { value: 'THURSDAY', short: 'Thu' },
  { value: 'FRIDAY', short: 'Fri' },
  { value: 'SATURDAY', short: 'Sat' },
  { value: 'SUNDAY', short: 'Sun' },
] as const

/** Phone inputs default to Nigeria, like sink-inventory's PhoneInput. */
export const DEFAULT_PHONE_COUNTRY = 'NG'
