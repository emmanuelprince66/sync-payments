import type { WalletTrx } from '@/api/transactions'
import { initials } from '@/lib/format'

/** The design's status names for the API's. */
export const trxStatus = (status: string) => {
  if (status === 'SUCCESS' || status === 'SUCCESSFUL' || status === 'COMPLETED') return 'Completed'
  if (status === 'PENDING' || status === 'PROCESSING') return 'Pending'
  if (status === 'REVERSED') return 'Reversed'
  if (status === 'FAILED') return 'Failed'
  return status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Pending'
}

const CHANNELS: Record<string, string> = { TERMINAL: 'Terminal', TRANSFER: 'Bank transfer', ONLINE: 'Online payment', POS: 'Terminal', '-': 'Bank transfer' }
export const trxChannel = (channel: string) => CHANNELS[channel.toUpperCase()] ?? channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase()

export const trxCustomer = (trx: WalletTrx) => trx.accountName || trx.description || (trx.type === 'CREDIT' ? 'Wallet credit' : 'Wallet debit')
export const trxInitials = (trx: WalletTrx) => initials(trxCustomer(trx)) || 'TX'
export const trxShortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8).toUpperCase()}` : id)

const parse = (iso: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "Jun 20" */
export const trxDay = (iso: string) => parse(iso)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '—'
/** "10:42 AM" */
export const trxTime = (iso: string) => parse(iso)?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) ?? ''
/** "Jun 20, 2026, 10:42 AM" */
export const trxDateTime = (iso: string) => {
  const date = parse(iso)
  return date ? `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${trxTime(iso)}` : '—'
}

/** "•• 1234" */
export const maskAccount = (accountNumber?: string) => (accountNumber ? `•• ${accountNumber.slice(-4)}` : '••')

/** "0048 9210 6735" style grouping of an account number. */
export const groupAccount = (accountNumber: string) => accountNumber.replace(/(.{4})(?=.)/g, '$1 ')

const toCsv = (rows: (string | number)[][]) => rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')

/** Downloads rows as a CSV file from the browser. */
export const downloadCsv = (name: string, rows: (string | number)[][]) => {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sync360-${name}-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export const exportTransactionsCsv = (rows: WalletTrx[], name = 'transactions') =>
  downloadCsv(name, [
    ['Transaction ID', 'Reference', 'Customer', 'Type', 'Channel', 'Amount', 'Charges', 'Account number', 'Bank', 'Date', 'Status', 'Description'],
    ...rows.map(trx => [trx.id, trx.reference, trx.accountName, trx.type, trx.channel, trx.amount, trx.charges, trx.accountNumber, trx.bankName, trxDateTime(trx.createdAt), trx.status, trx.description]),
  ])
