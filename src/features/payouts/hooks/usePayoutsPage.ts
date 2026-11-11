import { toast } from 'sonner'
import { usePayoutActivity } from '@/api/payouts'
import { useDisclosure } from '@/hooks/useDisclosure'
import { lastDays, useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { downloadCsv } from '@/lib/csv'

const RECENT_TRANSFERS = 5

/** Payouts are transfers out of the wallet: sink's Transfer Funds flow, plus what was sent in the period. */
export function usePayoutsPage() {
  const money = useFormatMoney()
  const transfer = useDisclosure()
  const dates = useDateRangeFilter({ initial: () => lastDays(7) })
  // Cleared: back to the last week, so the chart always has a window.
  const period = dates.range?.from ? dates.range : lastDays(7)
  const activity = usePayoutActivity(period.from as Date, (period.to ?? period.from) as Date)
  const sent = activity.rows.reduce((sum, row) => sum + row.amount, 0)

  return {
    money,
    balance: money(activity.balance),
    sent: money(sent),
    sentNote: `${activity.rows.length} transfer${activity.rows.length === 1 ? '' : 's'} in this period`,
    recent: activity.rows.slice(0, RECENT_TRANSFERS),
    chart: activity.chart,
    dateRange: dates.range,
    setDateRange: dates.setRange,
    isEmpty: activity.rows.length === 0,
    activityLoading: activity.isLoading,
    activityError: activity.isError,
    hasBank: activity.hasBank,
    transfer,
    exportCsv: () => {
      if (!activity.rows.length) return toast.error('There are no payouts to export.')
      downloadCsv('payouts.csv', ['Date', 'Recipient', 'Reference', 'Status', 'Amount'], activity.rows.map(row => [row.createdAt, row.accountName, row.reference, row.status, row.amount]))
    },
  }
}

export type PayoutsModel = ReturnType<typeof usePayoutsPage>
