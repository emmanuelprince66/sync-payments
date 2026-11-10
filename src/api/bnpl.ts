import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useCurrentBusinessId } from './business'
import { asRecord, isLive, num, str, type UnknownRecord } from './http'
import { queryKeys } from './query-keys'

/**
 * Akawopay — Buy Now, Pay Later. Same endpoints as sink-inventory:
 *  PATCH business/{id}/            { enable_bnpl }   → on/off (useSetBnpl in ./storefront-settings)
 *  GET   business/{id}/pending_bnpl/?stage&search&start_date&end_date&page&page_size
 *        → { links, total, limit, pages, summary, results }
 *
 * Pending settlements are BNPL sales whose goods are already released but whose
 * payout runs on Akawopay's own cycle: money the merchant is owed, not money in
 * the wallet, which is why they are shown apart from the transaction list.
 */

/** Where a payout sits. Rows carry the canonical uppercase form. */
export type BnplSettlementStage = 'AWAITING_SETTLEMENT' | 'PROCESSING_PAYOUT' | 'FAILED_RETRYING' | 'SETTLED'

/**
 * The `stage` filter, sent lowercase as documented. "all" is the only way to
 * see settled payouts alongside pending ones; omitting it returns outstanding only.
 */
export type BnplStageFilter = 'all' | 'awaiting_settlement' | 'processing_payout' | 'failed_retrying' | 'settled'

export type PendingBnplCustomer = { id: string; name: string; phone: string | null; email: string | null }

export type PendingBnplOrder = {
  saleId: string
  orderReference: string
  channel: string
  /** Null on a walk-in that was never tied to a customer record. */
  customer: PendingBnplCustomer | null
  /** What the customer was charged. */
  orderAmount: number
  /** Pre-formatted by the API, e.g. "3.00%". */
  feeRate: string
  feeDeducted: number
  /** What lands in the wallet: order amount minus the fee. */
  netSettlementAmount: number
  orderDate: string
  stage: string
  stageLabel: string
  stageDescription: string
  akawopayChargeId: string | null
  walletTransactionId: string | null
  /** When the money landed. Null until SETTLED. */
  settledAt: string | null
}

type StageBreakdown = { count: number; grossAmount: number; netAmount: number }

export type PendingBnplSummary = {
  totalPendingGross: number
  totalEstimatedNet: number
  totalEstimatedFees: number
  totalPendingOrders: number
  totalSettledGross: number
  totalSettledNet: number
  totalSettledFees: number
  totalSettledOrders: number
  /** Counted over the whole date range, so tab badges keep their numbers when one is selected. */
  breakdown: Partial<Record<BnplStageFilter, StageBreakdown>>
}

export type PendingBnpl = { total: number; pages: number; summary: PendingBnplSummary; results: PendingBnplOrder[] }

export type PendingBnplParams = {
  stage: BnplStageFilter
  search?: string
  startDate?: string
  endDate?: string
  page: number
  pageSize: number
}

// ─── Mapping ────────────────────────────────────────────────────────────────

const nullable = (value: unknown) => str(value) || null

const mapOrder = (value: unknown): PendingBnplOrder => {
  const row = asRecord(value)
  const customer = row.customer ? asRecord(row.customer) : null
  return {
    saleId: str(row.sale_id),
    orderReference: str(row.order_reference),
    channel: str(row.channel),
    customer: customer ? { id: str(customer.id), name: str(customer.name), phone: nullable(customer.phone), email: nullable(customer.email) } : null,
    orderAmount: num(row.order_amount),
    feeRate: str(row.fee_rate),
    feeDeducted: num(row.fee_deducted),
    netSettlementAmount: num(row.net_settlement_amount),
    orderDate: str(row.order_date),
    stage: str(row.settlement_stage).toUpperCase(),
    stageLabel: str(row.stage_label) || str(row.settlement_stage),
    stageDescription: str(row.stage_description),
    akawopayChargeId: nullable(row.akawopay_charge_id),
    walletTransactionId: nullable(row.wallet_transaction_id),
    settledAt: nullable(row.settled_at),
  }
}

const STAGE_KEYS: BnplStageFilter[] = ['all', 'awaiting_settlement', 'processing_payout', 'failed_retrying', 'settled']

/** `net_amount` is the uniform name; `estimated_net` / `settled_net` are older per-stage names still sent. */
const mapBreakdown = (value: unknown): PendingBnplSummary['breakdown'] => {
  const record = asRecord(value)
  const breakdown: PendingBnplSummary['breakdown'] = {}
  for (const key of STAGE_KEYS) {
    if (!record[key]) continue
    const stage = asRecord(record[key])
    breakdown[key] = { count: num(stage.count), grossAmount: num(stage.gross_amount), netAmount: num(stage.net_amount ?? stage.estimated_net ?? stage.settled_net) }
  }
  return breakdown
}

const mapSummary = (value: unknown): PendingBnplSummary => {
  const s = asRecord(value)
  return {
    totalPendingGross: num(s.total_pending_gross),
    totalEstimatedNet: num(s.total_estimated_net),
    totalEstimatedFees: num(s.total_estimated_fees),
    totalPendingOrders: num(s.total_pending_orders),
    totalSettledGross: num(s.total_settled_gross),
    totalSettledNet: num(s.total_settled_net),
    totalSettledFees: num(s.total_settled_fees),
    totalSettledOrders: num(s.total_settled_orders),
    breakdown: mapBreakdown(s.breakdown),
  }
}

/** The API answers `{ success, data, message }`; read defensively in case the envelope is dropped. */
const mapPendingBnpl = (payload: unknown): PendingBnpl => {
  const outer = asRecord(payload)
  const data: UnknownRecord = outer.summary || outer.results ? outer : asRecord(outer.data)
  return {
    total: num(data.total),
    pages: Math.max(num(data.pages), 1),
    summary: mapSummary(data.summary),
    results: Array.isArray(data.results) ? data.results.map(mapOrder) : [],
  }
}

// ─── Sample data (VITE_AUTH_MODE=mock only) ─────────────────────────────────

const sampleOrders: PendingBnplOrder[] = [
  { saleId: 's1', orderReference: 'KS-84219', channel: 'ONLINE', customer: { id: 'c1', name: 'Chidinma Okeke', phone: '0803 245 7791', email: null }, orderAmount: 48000, feeRate: '3.00%', feeDeducted: 1440, netSettlementAmount: 46560, orderDate: '2026-11-04T10:24:00Z', stage: 'AWAITING_SETTLEMENT', stageLabel: 'Awaiting settlement', stageDescription: 'Akawopay approved the plan; the payout is queued for the next settlement cycle.', akawopayChargeId: 'ak_1', walletTransactionId: null, settledAt: null },
  { saleId: 's2', orderReference: 'KS-84207', channel: 'IN_STORE', customer: null, orderAmount: 32500, feeRate: '3.00%', feeDeducted: 975, netSettlementAmount: 31525, orderDate: '2026-11-03T15:02:00Z', stage: 'PROCESSING_PAYOUT', stageLabel: 'Processing payout', stageDescription: 'The payout has been sent and is on its way to your wallet.', akawopayChargeId: 'ak_2', walletTransactionId: null, settledAt: null },
  { saleId: 's3', orderReference: 'KS-84188', channel: 'ONLINE', customer: { id: 'c2', name: 'Tobi Adeyemi', phone: null, email: 'tobi@example.com' }, orderAmount: 18500, feeRate: '3.00%', feeDeducted: 555, netSettlementAmount: 17945, orderDate: '2026-11-01T09:12:00Z', stage: 'SETTLED', stageLabel: 'Settled', stageDescription: 'Paid into your wallet.', akawopayChargeId: 'ak_3', walletTransactionId: 'w3', settledAt: '2026-11-02T08:00:00Z' },
]

const getMockPendingBnpl = ({ stage, page, pageSize }: PendingBnplParams): Promise<PendingBnpl> => {
  const pending = sampleOrders.filter(order => order.stage !== 'SETTLED')
  const settled = sampleOrders.filter(order => order.stage === 'SETTLED')
  const sum = (list: PendingBnplOrder[], key: 'orderAmount' | 'netSettlementAmount' | 'feeDeducted') => list.reduce((total, order) => total + order[key], 0)
  const byStage = (key: BnplSettlementStage) => sampleOrders.filter(order => order.stage === key)
  const results = stage === 'all' ? sampleOrders : sampleOrders.filter(order => order.stage === stage.toUpperCase())
  const stageEntry = (list: PendingBnplOrder[]) => ({ count: list.length, grossAmount: sum(list, 'orderAmount'), netAmount: sum(list, 'netSettlementAmount') })
  return mockDelay({
    total: results.length,
    pages: Math.max(Math.ceil(results.length / pageSize), 1),
    results: results.slice((page - 1) * pageSize, page * pageSize),
    summary: {
      totalPendingGross: sum(pending, 'orderAmount'), totalEstimatedNet: sum(pending, 'netSettlementAmount'), totalEstimatedFees: sum(pending, 'feeDeducted'), totalPendingOrders: pending.length,
      totalSettledGross: sum(settled, 'orderAmount'), totalSettledNet: sum(settled, 'netSettlementAmount'), totalSettledFees: sum(settled, 'feeDeducted'), totalSettledOrders: settled.length,
      breakdown: {
        awaiting_settlement: stageEntry(byStage('AWAITING_SETTLEMENT')),
        processing_payout: stageEntry(byStage('PROCESSING_PAYOUT')),
        failed_retrying: stageEntry(byStage('FAILED_RETRYING')),
        settled: stageEntry(settled),
      },
    },
  })
}

// ─── Service + hook ─────────────────────────────────────────────────────────

const fetchPendingBnpl = async (businessId: string, params: PendingBnplParams) => {
  const query = new URLSearchParams({ stage: params.stage, page: String(params.page), page_size: String(params.pageSize) })
  if (params.search) query.set('search', params.search)
  if (params.startDate) query.set('start_date', params.startDate)
  if (params.endDate) query.set('end_date', params.endDate)
  return mapPendingBnpl(await apiRequest<unknown>(`business/${businessId}/pending_bnpl/?${query}`))
}



/** Akawopay settlements still on their way to the wallet (plus settled ones on the "All"/"Settled" tabs). */
export const usePendingBnpl = (params: PendingBnplParams) => {
  const { businessId } = useCurrentBusinessId()
  const live = isLive()
  return useQuery({
    queryKey: [...queryKeys.bnpl, 'pending', live ? businessId : 'mock', params],
    queryFn: () => (live ? fetchPendingBnpl(businessId as string, params) : getMockPendingBnpl(params)),
    enabled: !live || Boolean(businessId),
    placeholderData: keepPreviousData,
  })
}
