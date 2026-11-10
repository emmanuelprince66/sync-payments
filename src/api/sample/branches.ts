import { mockDelay } from '@/lib/api-client'
import { isoDay } from '@/lib/format'
import type { UnknownRecord } from '../http'
import type { BusinessBank } from '../business'

/**
 * What GET wallet/{bank_id}/ answers per account, for VITE_AUTH_MODE=mock only,
 * and branches added in a mock session. Keyed on the mock banks in api/transactions.ts.
 */

const todayByBank: Record<string, { inflow: number; total: number }> = {
  'mock-bank': { inflow: 18240, total: 284 },
  'mock-bank-payroll': { inflow: 12890, total: 196 },
  'mock-bank-tax': { inflow: 9481, total: 148 },
}

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString()

const trx = (id: string, name: string, amount: number, type: 'CREDIT' | 'DEBIT', hours: number, status: string, mode: string, reference: string) =>
  ({ id, account_name: name, amount: String(amount), type, created_at: hoursAgo(hours), status, mode, transaction_id: reference, description: `Transfer ${reference}` })

const transactions: Record<string, UnknownRecord[]> = {
  'mock-bank': [
    trx('TX-840291', 'Northstar Coffee', 2840, 'CREDIT', 2, 'SUCCESS', 'STORE', 'SYNC-724091'),
    trx('TX-840290', 'Avery Stone', 12500, 'CREDIT', 3, 'SUCCESS', 'OUTSTORE', 'ACH-579320'),
    trx('TX-840287', 'Juniper Market', 5200, 'DEBIT', 26, 'SUCCESS', 'OUTSTORE', 'PAY-001829'),
  ],
  'mock-bank-payroll': [trx('TX-840288', 'Olive & Reed', 429.99, 'CREDIT', 15, 'SUCCESS', 'STORE', 'SYNC-724088')],
  'mock-bank-tax': [
    trx('TX-840289', 'Fieldwork Studio', 1760.5, 'CREDIT', 4, 'PENDING', 'STORE', 'SYNC-724089'),
    trx('TX-840286', 'Common Ground LLC', 980, 'CREDIT', 20, 'REVERSED', 'STORE', 'SYNC-724086'),
  ],
}

/** Same envelope as GET wallet/{bank_id}/. */
export const getMockWallet = (bankId: string, params: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const todayKey = isoDay(new Date())
  const today = params.startDate === todayKey && params.endDate === todayKey ? todayByBank[bankId] : undefined
  const rows = (transactions[bankId] ?? []).filter(row => {
    const day = isoDay(new Date(String(row.created_at)))
    return (!params.startDate || day >= params.startDate) && (!params.endDate || day <= params.endDate)
  })
  return mockDelay({
    results: { inflow: today?.inflow ?? 0, transactions: rows.slice((page - 1) * limit, page * limit) },
    pages: Math.max(Math.ceil(rows.length / limit), 1),
    total: today?.total ?? rows.length,
  })
}

let added: BusinessBank[] = []

export const getMockAddedBranches = () => mockDelay([...added], 100)

export const addMockBranch = (branch: string) => {
  const bank: BusinessBank = { id: `mock-branch-${Date.now()}`, account_name: branch, account_number: String(48921100 + added.length).padStart(10, '0'), bank_name: 'VFD Microfinance Bank', is_sub: true }
  added = [...added, bank]
  return mockDelay(bank, 700)
}
