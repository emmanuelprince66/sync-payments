import { mockDelay } from '@/lib/api-client'
import { isoDay } from '@/lib/format'

/** Sample data: the backend has no reconciliation endpoints yet. */

export type ReconciliationException = {
  id: string
  source: string
  expected: number
  /** Null until the bank settlement arrives. */
  received: number | null
  /** ISO timestamp. */
  occurredAt: string
  date: string
  resolved: boolean
}

export type ReconciliationRange = { startDate: string; endDate: string }

export type ReconciliationData = {
  settlementTotal: number
  settlementDate: string
  autoMatched: number
  matchRate: string
  needsReview: number
  highPriority: string
  totalVariance: number
  variancePercent: string
  exceptions: ReconciliationException[]
}

/** Dated relative to today so the sample always has something to filter. */
const sampleAt = (hours: number) => {
  const date = new Date(Date.now() - hours * 3600 * 1000)
  return { occurredAt: date.toISOString(), date: date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }
}

let data: ReconciliationData = {
  settlementTotal: 48291,
  settlementDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  autoMatched: 1205,
  matchRate: '94% match rate',
  needsReview: 79,
  highPriority: '3 high priority',
  totalVariance: 1264,
  variancePercent: '0.03% of volume',
  exceptions: [
    { id: 'REC-2048', source: 'Terminal NYC–001', expected: 2840, received: 2812, ...sampleAt(2), resolved: false },
    { id: 'REC-2047', source: 'ACH settlement', expected: 12500, received: 12500, ...sampleAt(30), resolved: false },
    { id: 'REC-2046', source: 'Terminal LAX–004', expected: 1760.5, received: null, ...sampleAt(100), resolved: false },
  ],
}

export const getReconciliation = ({ startDate, endDate }: ReconciliationRange) => mockDelay({
  ...data,
  exceptions: data.exceptions.filter(row => {
    const day = isoDay(new Date(row.occurredAt))
    return (!startDate || day >= startDate) && (!endDate || day <= endDate)
  }),
})

export const resolveException = (id: string) => {
  data = {
    ...data,
    needsReview: Math.max(0, data.needsReview - 1),
    exceptions: data.exceptions.map(row => (row.id === id ? { ...row, resolved: true } : row)),
  }
  return mockDelay(data, 250)
}

/** Settles anything still pending and reports how many items that matched. */
export const runReconciliation = () => {
  const pending = data.exceptions.filter(row => row.received === null).length
  data = {
    ...data,
    autoMatched: data.autoMatched + pending,
    exceptions: data.exceptions.map(row => (row.received === null ? { ...row, received: row.expected } : row)),
  }
  return mockDelay({ matched: pending }, 800)
}
