import { mockDelay } from '@/lib/api-client'

/** Sample data: the backend has no endpoint for scheduled or automatic payouts. */

export type ScheduledPayout = { date: string; amount: number; status: 'Processing' | 'Scheduled'; account: string }

export type NextPayout = {
  amount: number
  account: string
  arrival: string
}

const next: NextPayout = { amount: 61340.2, account: 'Chase Business •• 4821', arrival: 'Arrives Monday, Jun 23 by 5:00 PM' }

const schedule: ScheduledPayout[] = [
  { date: 'Today', amount: 8420, status: 'Processing', account: 'Chase •• 4821' },
  { date: 'Mon, Jun 23', amount: 61340.2, status: 'Scheduled', account: 'Chase •• 4821' },
  { date: 'Tue, Jun 24', amount: 24812.4, status: 'Scheduled', account: 'Chase •• 4821' },
]

export const getPayoutSchedule = () => mockDelay({ next, schedule, cadence: 'Automatic, every business day' })
