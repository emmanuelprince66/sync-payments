import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { usePayoutActivity, usePayoutSchedule } from '@/api/payouts'
import { lastDays, useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { downloadCsv } from '@/lib/csv'
import { paths } from '@/routes/paths'

export function usePayoutsPage() {
  const navigate = useNavigate()
  const schedule = usePayoutSchedule()
  const dates = useDateRangeFilter({ initial: () => lastDays(7) })
  // Cleared: back to the last week, so the chart always has a window.
  const period = dates.range?.from ? dates.range : lastDays(7)
  const activity = usePayoutActivity(period.from as Date, (period.to ?? period.from) as Date)

  return {
    schedule: schedule.data,
    chart: activity.chart,
    dateRange: dates.range,
    setDateRange: dates.setRange,
    isEmpty: activity.rows.length === 0,
    activityLoading: activity.isLoading,
    activityError: activity.isError,
    hasBank: activity.hasBank,
    newPayout: () => navigate(paths.payments),
    exportCsv: () => {
      if (!activity.rows.length) return toast.error('There are no payouts to export.')
      downloadCsv('payouts.csv', ['Date', 'Recipient', 'Reference', 'Status', 'Amount'], activity.rows.map(row => [row.createdAt, row.accountName, row.reference, row.status, row.amount]))
    },
  }
}
