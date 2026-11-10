import { isoDay } from '@/lib/format'

/** "2026-06-20" → "Jun 20". */
export const shortDate = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

/** "2026-06-20" → "20 JUN 2026". */
export const ledgerDate = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}

export const isoDaysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return isoDay(date)
}
