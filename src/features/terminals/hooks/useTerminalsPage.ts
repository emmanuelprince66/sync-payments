import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { isTerminalSuccess, useTerminalPayments, useTerminals, type TerminalPayment } from '@/api/terminals'
import { useBusinessBanks, useWalletAccount } from '@/api/transactions'
import { useClipboard } from '@/hooks/useClipboard'
import { useDebounce } from '@/hooks/useDebounce'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { isoDay } from '@/lib/format'
import { PAY_CARD_PRINT_ID } from '../constants'

/** Figures for the stat cards and terminal cards are read from the latest payments. */
const STATS_LIMIT = 100

export const TERMINAL_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'SUCCESS', label: 'Successful' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
] as const

const isToday = (payment: TerminalPayment) => {
  const date = new Date(payment.createdAt)
  return !Number.isNaN(date.getTime()) && isoDay(date) === isoDay(new Date())
}

export function useTerminalsPage() {
  const money = useFormatMoney()
  const terminals = useTerminals()
  const banks = useBusinessBanks()
  const payCard = useDisclosure()
  const addInfo = useDisclosure()
  const { copied, copy } = useClipboard()
  const [downloading, setDownloading] = useState(false)

  /** sink's "Download Payment Terminal": the card captured at 3x as a PNG, with the sm layout forced on. */
  const downloadPayCard = async (name: string) => {
    const element = document.getElementById(PAY_CARD_PRINT_ID)
    if (!element) return
    setDownloading(true)
    try {
      await Promise.all(Array.from(element.querySelectorAll('img')).map(img => (img.complete ? null : new Promise(resolve => { img.onload = resolve; img.onerror = resolve }))))
      const html2canvas = (await import('html2canvas-pro')).default
      const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff', logging: false, useCORS: true, windowWidth: Math.max(element.scrollWidth, 800), windowHeight: Math.max(element.scrollHeight, 800) })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${(name || 'store').replace(/[^a-zA-Z0-9]/g, '_')}_payment_terminal.png`
      link.click()
    } catch {
      toast.error('Could not download the payment terminal. Try Print instead.')
    } finally {
      setDownloading(false)
    }
  }

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 500)
  const [status, setStatus] = useState<string>('')
  const [terminal, setTerminal] = useState('')
  const [page, setPage] = useState(1)

  const latest = useTerminalPayments({ page: 1, search: '', status: '', terminal: '', limit: STATS_LIMIT })
  const list = useTerminalPayments({ page, search, status, terminal })
  // sink's payment terminal card shows the wallet's own details.
  const wallet = useWalletAccount({ page: 1, search: '', filter: 'ALL', startDate: '', endDate: '', limit: 1 })

  const stats = useMemo(() => {
    const rows = latest.data?.rows ?? []
    const todaySuccess = rows.filter(row => isToday(row) && isTerminalSuccess(row.status))
    const byTerminal = new Map<string, { total: number; count: number }>()
    for (const row of todaySuccess) {
      const entry = byTerminal.get(row.terminal) ?? { total: 0, count: 0 }
      entry.total += row.amount
      entry.count += 1
      byTerminal.set(row.terminal, entry)
    }
    const successful = rows.filter(row => isTerminalSuccess(row.status)).length
    return {
      todayVolume: todaySuccess.reduce((sum, row) => sum + row.amount, 0),
      todayCount: todaySuccess.length,
      approvalRate: rows.length ? `${((successful / rows.length) * 100).toFixed(1)}%` : '—',
      approvalNote: rows.length ? `From the latest ${rows.length} payments` : 'No payments yet',
      byTerminal,
    }
  }, [latest.data])

  const rows = terminals.data ?? []
  const details = wallet.data?.wallet
  const storeUrl = banks.storeUrl ? `https://store.sync360.africa/o/${banks.storeUrl}` : ''

  return {
    loading: terminals.isLoading,
    terminals: rows.map(row => {
      const today = stats.byTerminal.get(row.terminalId)
      return { ...row, today: money(today?.total ?? 0), count: today?.count ?? 0, selected: terminal === row.terminalId }
    }),
    activeCount: rows.filter(row => row.active).length,
    totalCount: rows.length,
    todayVolume: money(stats.todayVolume),
    todayCount: stats.todayCount,
    approvalRate: stats.approvalRate,
    approvalNote: stats.approvalNote,
    statsLoading: latest.isLoading,
    selectTerminal: (id: string) => { setTerminal(current => (current === id ? '' : id)); setPage(1) },
    payments: {
      rows: list.data?.rows ?? [],
      loading: list.isLoading && !list.data,
      searchInput,
      setSearch: (value: string) => { setSearchInput(value); setPage(1) },
      status,
      setStatus: (value: string) => { setStatus(value); setPage(1) },
      terminal,
      page,
      pages: list.data?.pages ?? 1,
      setPage,
      money,
    },
    payCard: {
      ...payCard,
      bankName: details?.bankName ?? '',
      accountNumber: details?.accountNumber ?? '',
      accountName: details?.accountName ?? '',
      loading: wallet.isLoading,
      storeUrl,
      copied,
      copyUrl: () => { if (storeUrl) void copy(storeUrl) },
      print: () => window.print(),
      downloading,
      download: () => { void downloadPayCard(details?.accountName ?? '') },
    },
    addInfo,
  }
}

export type TerminalsModel = ReturnType<typeof useTerminalsPage>
