import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useCurrentBusinessId } from './business'
import { asRecord, at, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'

/**
 * POS terminals assigned to the business.
 *  GET terminal/businesses/{business_id}/terminals/?search
 *  GET terminal/businesses/{business_id}/payments/?search&page&limit&status&type&terminal
 *      → { count, results } (owners see every payment, attendants their own)
 */

export const TERMINAL_PAYMENTS_PAGE_SIZE = 20

export type Terminal = {
  id: string
  terminalId: string
  serialNumber: string
  name: string
  settlementAccount: string
  active: boolean
  accountMatches: boolean
}

export type TerminalPayment = {
  id: string
  terminal: string
  type: string
  amount: number
  rrn: string
  status: string
  description: string
  error: string
  createdAt: string
}

export type TerminalPaymentQuery = { page: number; search: string; status: string; terminal: string; limit?: number }
export type TerminalPaymentsPage = { rows: TerminalPayment[]; total: number; pages: number }

const mapTerminal = (value: unknown): Terminal => {
  const row = asRecord(value)
  return {
    id: str(row.id),
    terminalId: str(row.terminal_id),
    serialNumber: str(row.serial_number),
    name: str(row.name),
    settlementAccount: str(row.settlement_account_number),
    active: row.is_active === true,
    accountMatches: row.account_matches_lux !== false,
  }
}

const mapPayment = (value: unknown): TerminalPayment => {
  const row = asRecord(value)
  return {
    id: str(row.id),
    terminal: str(row.terminal),
    type: str(row.type),
    amount: num(row.amount),
    rrn: str(row.rrn),
    status: str(row.status).toUpperCase(),
    description: str(row.description),
    error: str(row.error),
    createdAt: str(row.created_at),
  }
}

/** The status values aren't documented, so anything that reads as a success counts. */
export const isTerminalSuccess = (status: string) => /SUCCESS|APPROVED|COMPLETE/.test(status)

// ─── Mock (VITE_AUTH_MODE=mock only): the design's sample terminals ─────────

const MOCK_TERMINALS: Terminal[] = [
  { id: '1', terminalId: 'LOS-001', serialNumber: 'SN-98212', name: 'Ikoyi Flagship', settlementAccount: '0048921067', active: true, accountMatches: true },
  { id: '2', terminalId: 'LOS-002', serialNumber: 'SN-98213', name: 'Lekki Phase 1', settlementAccount: '0048921067', active: true, accountMatches: true },
  { id: '3', terminalId: 'ABJ-004', serialNumber: 'SN-98214', name: 'Wuse 2', settlementAccount: '0048921067', active: true, accountMatches: true },
  { id: '4', terminalId: 'PHC-003', serialNumber: 'SN-98215', name: 'GRA Port Harcourt', settlementAccount: '0048921067', active: false, accountMatches: true },
]

const mockPayment = (id: number, terminal: string, amount: number, status: string, hours: number): TerminalPayment => ({
  id: String(id), terminal, type: 'CARD', amount, rrn: `72409${id}`, status, description: 'Card payment', error: status === 'FAILED' ? 'Declined by issuer' : '', createdAt: new Date(Date.now() - hours * 3600 * 1000).toISOString(),
})

const MOCK_PAYMENTS: TerminalPayment[] = [
  mockPayment(1, 'LOS-001', 18240, 'SUCCESS', 0), mockPayment(2, 'LOS-001', 2840, 'SUCCESS', 0), mockPayment(3, 'LOS-002', 12890, 'SUCCESS', 0),
  mockPayment(4, 'ABJ-004', 9481, 'SUCCESS', 0), mockPayment(5, 'ABJ-004', 1760.5, 'PENDING', 0), mockPayment(6, 'LOS-002', 980, 'FAILED', 0), mockPayment(7, 'PHC-003', 7680, 'SUCCESS', 30),
]

// ─── Hooks ──────────────────────────────────────────────────────────────────

const getTerminals = async (businessId: string) => {
  const response = await apiRequest<unknown>(`terminal/businesses/${businessId}/terminals/`)
  return listFrom(response, ['results', 'data', 'results.data']).map(mapTerminal)
}

export const useTerminals = () => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...queryKeys.terminals, 'list', businessId],
    queryFn: () => (isLive() ? getTerminals(businessId as string) : mockDelay(MOCK_TERMINALS)),
    enabled: !isLive() || Boolean(businessId),
  })
}

const getPayments = async (businessId: string, query: TerminalPaymentQuery): Promise<TerminalPaymentsPage> => {
  const limit = query.limit ?? TERMINAL_PAYMENTS_PAGE_SIZE
  const params = new URLSearchParams({ page: String(query.page), limit: String(limit) })
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.terminal) params.set('terminal', query.terminal)
  const response = await apiRequest<unknown>(`terminal/businesses/${businessId}/payments/?${params.toString()}`)
  const total = num(at(response, 'count')) || num(at(response, 'total'))
  return { rows: listFrom(response, ['results', 'data', 'results.data']).map(mapPayment), total, pages: Math.max(num(at(response, 'pages')) || Math.ceil(total / limit), 1) }
}

const getMockPayments = (query: TerminalPaymentQuery): Promise<TerminalPaymentsPage> => {
  const term = query.search.toLowerCase()
  const rows = MOCK_PAYMENTS.filter(row => (!query.status || row.status === query.status) && (!query.terminal || row.terminal === query.terminal) && (!term || [row.terminal, row.rrn].some(value => value.toLowerCase().includes(term))))
  return mockDelay({ rows, total: rows.length, pages: 1 })
}

export const useTerminalPayments = (query: TerminalPaymentQuery) => {
  const { businessId } = useCurrentBusinessId()
  return useQuery({
    queryKey: [...queryKeys.terminals, 'payments', businessId, query],
    queryFn: () => (isLive() ? getPayments(businessId as string, query) : getMockPayments(query)),
    enabled: !isLive() || Boolean(businessId),
    placeholderData: keepPreviousData,
  })
}
