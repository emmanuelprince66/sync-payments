import type { Expense, ExpenseTransfer } from '@/api/expenses'
import { formatActivityDate } from '@/api/http'

/**
 * sink-inventory's transfer statuses (types/expense-governance): wording, colour and the one-line hint
 * the details sheet shows, kept in one table so the badge, filters and modal can't drift apart.
 */
export const TRANSFER_STATUS: Record<string, { label: string; className: string; hint: string }> = {
  PENDING_APPROVAL: { label: 'Pending approval', className: 'bg-[#FFF6E4] text-[#A76700]', hint: 'Waiting for an approver to review it.' },
  PENDING_OWNER_APPROVAL: { label: 'Awaiting owner', className: 'bg-[#FFF6E4] text-[#A76700]', hint: 'Above the staff approval cap, so only the owner can release it.' },
  PENDING: { label: 'Pending approval', className: 'bg-[#FFF6E4] text-[#A76700]', hint: 'Waiting for an approver to review it.' },
  APPROVED: { label: 'Approved', className: 'bg-[#E7F1FC] text-[#1C6FA8]', hint: 'Approved and queued for the bank.' },
  PROCESSING: { label: 'Processing', className: 'bg-[#E7F1FC] text-[#1C6FA8]', hint: 'With the bank. Nothing to do but wait.' },
  SUCCESS: { label: 'Paid', className: 'bg-accent text-secondary', hint: 'Sent, and recorded as an expense.' },
  FAILED: { label: 'Failed', className: 'bg-[#FDEAEA] text-[#C72D34]', hint: 'The bank rejected the payout.' },
  REJECTED: { label: 'Rejected', className: 'bg-muted text-muted-foreground', hint: 'Declined by an approver.' },
}

export const transferStatus = (status: string) =>
  TRANSFER_STATUS[status] ?? { label: status ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ') : 'Unknown', className: 'bg-muted text-muted-foreground', hint: '' }

const PENDING = ['PENDING_APPROVAL', 'PENDING_OWNER_APPROVAL', 'PENDING']
export const isPending = (status: string) => PENDING.includes(status)

export type ApprovalKind = 'expense' | 'transfer'

/** One request an approver can review: a payout (transfer) or a logged expense. */
export type ApprovalItem = {
  id: string
  kind: ApprovalKind
  reference: string
  title: string
  requester: string
  amount: number
  /** From the API for a payout (charges, stamp_duty, total_debit); null for a logged expense or when absent. */
  fees: { charges: number; stampDuty: number; totalDebit: number } | null
  category: string
  status: string
  canDecide: boolean
  /** Why this person can't act on a pending item (sink: approvalBlockReason). */
  blockReason: string
  details: [string, string][]
  /** Who decided it and when, once someone has. */
  decision: { by: string; at: string; reason: string; outcome: 'approved' | 'rejected' } | null
}

/** sink: approvalBlockReason. The commonest reason is separation of duties: whoever asked never releases it. */
const blockReason = (status: string, canApprove: boolean, initiatedBy: string, userId: string) => {
  if (canApprove || !isPending(status)) return ''
  if (userId && initiatedBy === userId) return 'You started this one, so someone else has to approve it.'
  if (status === 'PENDING_OWNER_APPROVAL') return 'Above the staff approval cap: only the owner can release it.'
  return 'Waiting on someone with approval rights.'
}

const when = (value: string) => (value ? formatActivityDate(value) : '')

export const fromTransfer = (transfer: ExpenseTransfer, userId: string): ApprovalItem => ({
  id: transfer.id,
  kind: 'transfer',
  reference: transfer.reference,
  title: transfer.beneficiaryName || 'Transfer request',
  requester: transfer.initiatedByName || 'Team member',
  amount: transfer.amount,
  fees: transfer.hasFees ? { charges: transfer.charges, stampDuty: transfer.stampDuty, totalDebit: transfer.totalDebit } : null,
  category: transfer.category || 'Uncategorised',
  status: transfer.status,
  canDecide: transfer.canApprove && isPending(transfer.status),
  blockReason: blockReason(transfer.status, transfer.canApprove, transfer.initiatedBy, userId),
  details: [
    ['Beneficiary', transfer.beneficiaryName || '—'],
    ['Bank', [transfer.beneficiaryBank, transfer.beneficiaryAccount].filter(Boolean).join(' · ') || '—'],
    ['Category', transfer.category || 'Uncategorised'],
    ['Requested by', transfer.initiatedByName || 'Team member'],
    ['Requested on', when(transfer.createdAt) || '—'],
    ['Reference', transfer.reference],
    ...(transfer.narration ? [['Narration', transfer.narration] as [string, string]] : []),
  ],
  decision: transfer.rejectedByName || transfer.status === 'REJECTED'
    ? { by: transfer.rejectedByName || 'an approver', at: when(transfer.rejectedAt), reason: transfer.rejectionReason, outcome: 'rejected' }
    : transfer.approvedByName
      ? { by: transfer.approvedByName, at: when(transfer.approvedAt), reason: '', outcome: 'approved' }
      : null,
})

export const fromExpense = (expense: Expense): ApprovalItem => ({
  id: expense.id,
  kind: 'expense',
  reference: expense.reference,
  title: expense.name || 'Business expense',
  requester: expense.owner || 'Team member',
  amount: expense.amount,
  fees: null,
  category: expense.category || 'Uncategorised',
  status: expense.status,
  canDecide: expense.canApprove && isPending(expense.status),
  blockReason: blockReason(expense.status, expense.canApprove, '', ''),
  details: [
    ['Category', expense.category || 'Uncategorised'],
    ['Logged by', expense.owner || 'Team member'],
    ['Date', expense.date || '—'],
    ['Reference', expense.reference],
    ...(expense.note ? [['Note', expense.note] as [string, string]] : []),
  ],
  decision: expense.rejectedBy || expense.status === 'REJECTED'
    ? { by: expense.rejectedBy || 'an approver', at: '', reason: expense.rejectionReason, outcome: 'rejected' }
    : expense.approvedBy
      ? { by: expense.approvedBy, at: '', reason: '', outcome: 'approved' }
      : null,
})
