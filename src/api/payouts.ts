import { useQuery } from '@tanstack/react-query'
import { eachDayOfInterval } from 'date-fns'
import { useMemo } from 'react'
import { isoDay } from '@/lib/format'
import { queryKeys } from './query-keys'
import { getPayoutSchedule } from './sample/payouts'
import { useBusinessBanks, useWalletAccount } from './transactions'

export type { NextPayout, ScheduledPayout } from './sample/payouts'

/**
 * Payouts are money leaving the wallet, so activity reads the DEBIT side of
 * wallet/{bank_id}/. terminal/businesses/{id}/payments/ is collections on POS
 * terminals, not payouts. The automatic schedule has no endpoint: sample data.
 */

const ACTIVITY_LIMIT = 100
/** The chart stays readable on long ranges: newest days only. */
const MAX_CHART_DAYS = 31

export const usePayoutSchedule = () => useQuery({ queryKey: [...queryKeys.payouts, 'schedule'], queryFn: getPayoutSchedule })

/** Debit transfers in the range, and their total per day for the chart. */
export const usePayoutActivity = (from: Date, to: Date) => {
  const { selectedBankId, loading } = useBusinessBanks()
  const startDate = isoDay(from)
  const endDate = isoDay(to)
  const wallet = useWalletAccount({ page: 1, search: '', filter: 'DEBIT', startDate, endDate, limit: ACTIVITY_LIMIT })

  const rows = useMemo(() => (wallet.data?.transactions ?? []).filter(row => row.status !== 'FAILED'), [wallet.data])
  const chart = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(`${startDate}T00:00:00`), end: new Date(`${endDate}T00:00:00`) }).slice(-MAX_CHART_DAYS)
    return days.map(day => ({
      day: day.toLocaleDateString('en-US', days.length <= 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
      value: rows.filter(row => new Date(row.createdAt).toDateString() === day.toDateString()).reduce((sum, row) => sum + row.amount, 0),
    }))
  }, [startDate, endDate, rows])

  return { rows, chart, isLoading: loading || wallet.isLoading, isError: wallet.isError, hasBank: Boolean(selectedBankId) }
}
