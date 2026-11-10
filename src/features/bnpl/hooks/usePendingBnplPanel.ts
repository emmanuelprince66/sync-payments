import { useState } from 'react'
import { usePendingBnpl, type BnplStageFilter } from '@/api/bnpl'
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useFormatMoney } from '@/hooks/useFormatMoney'

export const BNPL_STAGE_TABS: readonly { value: BnplStageFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'awaiting_settlement', label: 'Awaiting settlement' },
  { value: 'processing_payout', label: 'Processing payout' },
  { value: 'failed_retrying', label: 'Retrying' },
  { value: 'settled', label: 'Settled' },
]

export const BNPL_PAGE_SIZE = 10

/**
 * Akawopay settlements (sink's PendingBnplPanel, via SyncShip). "all" rather than no
 * stage, so settled payouts show on the tab that claims to show everything.
 * A new stage or date range re-pages from 1. The tiles answer whichever
 * question the open tab asks: settled money on "Settled", owed money otherwise.
 */
export function usePendingBnplPanel() {
  const money = useFormatMoney()
  const [stage, setStageState] = useState<BnplStageFilter>('all')
  const [page, setPage] = useState(1)
  const dates = useDateRangeFilter({ onChange: () => setPage(1) })

  const query = usePendingBnpl({ stage, startDate: dates.startDate || undefined, endDate: dates.endDate || undefined, page, pageSize: BNPL_PAGE_SIZE })
  const summary = query.data?.summary
  const pendingCount = summary?.totalPendingOrders ?? 0
  const settledCount = summary?.totalSettledOrders ?? 0

  const tiles = stage === 'settled'
    ? [
        { label: 'Settled orders', value: String(settledCount), hint: 'Paid into your wallet' },
        { label: 'Settled gross', value: money(summary?.totalSettledGross ?? 0), hint: 'What customers were charged' },
        { label: 'Received', value: money(summary?.totalSettledNet ?? 0), hint: 'After Akawopay’s fee', tone: 'positive' as const },
        { label: 'Fees paid', value: money(summary?.totalSettledFees ?? 0), hint: 'Gateway deduction', tone: 'negative' as const },
      ]
    : [
        { label: 'Pending orders', value: String(pendingCount), hint: 'Goods already released' },
        { label: 'Pending gross', value: money(summary?.totalPendingGross ?? 0), hint: 'What customers were charged' },
        { label: 'Expected in wallet', value: money(summary?.totalEstimatedNet ?? 0), hint: 'After Akawopay’s fee', tone: 'positive' as const },
        { label: 'Fees', value: money(summary?.totalEstimatedFees ?? 0), hint: 'Gateway deduction', tone: 'negative' as const },
      ]

  return {
    tiles,
    tabs: BNPL_STAGE_TABS.map(tab => {
      // Counts come off the breakdown, totalled over the whole date range, so one tab doesn't zero the others.
      const count = tab.value === 'all' ? (summary ? pendingCount + settledCount : undefined) : summary?.breakdown[tab.value]?.count
      return { value: tab.value, label: count === undefined ? tab.label : `${tab.label} (${count})` }
    }),
    stage,
    setStage: (next: BnplStageFilter) => { setStageState(next); setPage(1) },
    dateRange: dates.range,
    setDateRange: dates.setRange,
    orders: query.data?.results ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching && !query.isLoading,
    retry: () => { void query.refetch() },
    page,
    pages: query.data?.pages ?? 1,
    setPage,
  }
}
