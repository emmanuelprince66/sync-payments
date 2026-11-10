import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useSalesSummary } from '@/api/analytics'
import { useBusinessBanks, useWalletAccount, type WalletTrx } from '@/api/transactions'
import { exportTransactionsCsv } from '@/features/transactions/format'
import { useTransactionDetails } from '@/features/transactions/hooks/useTransactionDetails'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { lastDays, useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { greeting, isoDay } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth-store'
import { SAMPLE_NEXT_PAYOUT, SAMPLE_RECONCILIATION } from '../sample'

/** Enough rows to total a period from one request; the API has no daily series. */
const FLOW_LIMIT = 200
const RECENT_ROWS = 5
const MAX_CHART_DAYS = 14

const sumBy = (rows: WalletTrx[], test: (trx: WalletTrx) => boolean) => rows.filter(test).reduce((total, trx) => total + trx.amount, 0)
const settled = (trx: WalletTrx) => trx.status !== 'FAILED' && trx.status !== 'REVERSED'

/** Inflow and payouts per day, newest days only. */
const buildFlow = (rows: WalletTrx[]) => {
  const days = new Map<string, { inflow: number; payout: number }>()
  for (const trx of rows) {
    const date = new Date(trx.createdAt)
    if (Number.isNaN(date.getTime()) || !settled(trx)) continue
    const key = isoDay(date)
    const day = days.get(key) ?? { inflow: 0, payout: 0 }
    if (trx.type === 'CREDIT') day.inflow += trx.amount
    else day.payout += trx.amount
    days.set(key, day)
  }
  return [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-MAX_CHART_DAYS).map(([key, day]) => {
    const date = new Date(`${key}T12:00:00`)
    return { day: date.toLocaleDateString('en-US', days.size <= 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' }), ...day }
  })
}

const changeNote = (today: number, yesterday: number) => {
  if (!yesterday) return 'So far today'
  const change = ((today - yesterday) / yesterday) * 100
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}% from yesterday`
}

/** One wallet request for the range feeds the balance, stats, chart and recent list. */
export function useOverviewPage() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const banks = useBusinessBanks()
  const range = useDateRangeFilter({ initial: () => lastDays(7) })
  const money = useFormatMoney()
  const { symbol } = useBusinessCurrency()
  const details = useTransactionDetails()
  const account = useWalletAccount({ page: 1, search: '', filter: 'ALL', startDate: range.startDate, endDate: range.endDate, limit: FLOW_LIMIT })
  const sales = useSalesSummary(range.startDate, range.endDate)
  const data = account.data
  const rows = useMemo(() => data?.transactions ?? [], [data])

  const stats = useMemo(() => {
    const today = isoDay(new Date())
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = isoDay(yesterdayDate)
    const dayOf = (trx: WalletTrx) => { const date = new Date(trx.createdAt); return Number.isNaN(date.getTime()) ? '' : isoDay(date) }
    const todayInflow = sumBy(rows, trx => trx.type === 'CREDIT' && settled(trx) && dayOf(trx) === today)
    const yesterdayInflow = sumBy(rows, trx => trx.type === 'CREDIT' && settled(trx) && dayOf(trx) === yesterday)
    const pending = rows.filter(trx => trx.status === 'PENDING')
    const successful = rows.filter(trx => trx.status === 'SUCCESS').length
    return {
      todayInflow: money(todayInflow),
      todayNote: changeNote(todayInflow, yesterdayInflow),
      processing: money(pending.reduce((total, trx) => total + trx.amount, 0)),
      processingNote: `${pending.length} awaiting settlement`,
      count: (data?.total ?? 0).toLocaleString(),
      countNote: rows.length ? `${((successful / rows.length) * 100).toFixed(1)}% successful` : 'In selected period',
    }
  }, [rows, data, money])

  const selected = banks.selectedBank
  const wallet = data?.wallet ?? null
  const accountLabel = selected?.account_name || wallet?.accountName || 'Main account'
  const now = new Date()

  return {
    loading: banks.loading || (account.isLoading && !data),
    date: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    greeting: `${greeting(now)}${user?.firstname ? `, ${user.firstname}` : ''}`,
    needsKyc: banks.needsKyc,
    goToKyc: () => navigate(paths.kyc),
    account: selected || wallet
      ? { accountNumber: wallet?.accountNumber || selected?.account_number || '', bankName: wallet?.bankName || selected?.bank_name || '', accountName: accountLabel, balance: wallet?.balance ?? 0 }
      : null,
    accountLabel,
    stats,
    range: { value: range.range, set: range.setRange },
    flow: buildFlow(rows),
    /** Axis ticks stay short: "₦120k". */
    axisTick: (value: number) => (value >= 1000 ? `${symbol}${Math.round(value / 1000)}k` : `${symbol}${value}`),
    tooltipValue: (value: number) => money(value),
    sales: sales.data && sales.data.revenue > 0 ? { revenue: money(sales.data.revenue), change: `${sales.data.revenueChange >= 0 ? '+' : ''}${sales.data.revenueChange}%` } : null,
    sample: { nextPayout: money(SAMPLE_NEXT_PAYOUT.amount), nextPayoutNote: SAMPLE_NEXT_PAYOUT.note, reconciliation: SAMPLE_RECONCILIATION },
    recent: rows.slice(0, RECENT_ROWS),
    details,
    statement: () => {
      if (!rows.length) { toast.info('There are no transactions in this period yet.'); return }
      exportTransactionsCsv(rows, 'statement')
    },
    makePayout: () => navigate(paths.payments),
    goToTransactions: () => navigate(paths.transactions),
    goToReconciliation: () => navigate(paths.reconciliation),
  }
}

export type OverviewModel = ReturnType<typeof useOverviewPage>
