import type { Expense, ExpenseTransfer } from '@/api/expenses'
import { formatActivityDate } from '@/api/http'
import type { SampleApproval } from '@/stores/sample-approvals-store'

export type ApprovalStatus = 'Awaiting approval' | 'Approved' | 'Rejected' | 'Processing' | 'Paid' | 'Failed'
export type ApprovalKind = 'expense' | 'transfer' | 'sample'

/** One row of the queue, whichever list it came from. */
export type ApprovalItem = {
  id: string
  kind: ApprovalKind
  reference: string
  title: string
  requester: string
  amount: number
  category: string
  submitted: string
  approver: string
  status: ApprovalStatus
  source: string
  canDecide: boolean
  /** Why this person can't act on a pending item (sink: approvalBlockReason). */
  blockReason: string
  note: string
  details: [string, string][]
}

const PENDING = ['PENDING_APPROVAL', 'PENDING_OWNER_APPROVAL', 'PENDING']

const statusOf = (status: string): ApprovalStatus => {
  if (PENDING.includes(status)) return 'Awaiting approval'
  if (status === 'REJECTED') return 'Rejected'
  if (status === 'SUCCESS') return 'Paid'
  if (status === 'PROCESSING') return 'Processing'
  if (status === 'FAILED') return 'Failed'
  return 'Approved'
}

const blockReason = (status: string, canApprove: boolean, initiatedBy: string, userId: string) => {
  if (canApprove || !PENDING.includes(status)) return ''
  if (userId && initiatedBy === userId) return 'You started this one, so someone else has to approve it.'
  if (status === 'PENDING_OWNER_APPROVAL') return 'Above the staff approval cap: only the owner can release it.'
  return 'Waiting on someone with approval rights.'
}

export const fromExpense = (expense: Expense): ApprovalItem => ({
  id: expense.id,
  kind: 'expense',
  reference: expense.reference,
  title: expense.name || 'Business expense',
  requester: expense.owner || 'Team member',
  amount: expense.amount,
  category: expense.category || 'Uncategorised',
  submitted: formatActivityDate(expense.createdAt || expense.date),
  approver: expense.approvedBy || expense.rejectedBy || 'Approver',
  status: statusOf(expense.status),
  source: 'Expense',
  canDecide: expense.canApprove && PENDING.includes(expense.status),
  blockReason: blockReason(expense.status, expense.canApprove, '', ''),
  note: expense.rejectionReason || expense.note,
  details: [['Date', expense.date || '—'], ...(expense.note ? [['Note', expense.note] as [string, string]] : [])],
})

export const fromTransfer = (transfer: ExpenseTransfer, userId: string, money: (amount: number) => string): ApprovalItem => ({
  id: transfer.id,
  kind: 'transfer',
  reference: transfer.reference,
  title: transfer.narration || `Transfer to ${transfer.beneficiaryName}`,
  requester: transfer.initiatedByName || 'Team member',
  amount: transfer.amount,
  category: transfer.category || 'Payment',
  submitted: formatActivityDate(transfer.createdAt),
  approver: transfer.approvedByName || 'Approver',
  status: statusOf(transfer.status),
  source: 'Transfer',
  canDecide: transfer.canApprove && PENDING.includes(transfer.status),
  blockReason: blockReason(transfer.status, transfer.canApprove, transfer.initiatedBy, userId),
  note: transfer.rejectionReason,
  details: [['Beneficiary', transfer.beneficiaryName || '—'], ['Bank', `${transfer.beneficiaryBank} •• ${transfer.beneficiaryAccount.slice(-4)}`], ['Bank charge', money(transfer.charges)]],
})

export const fromSample = (item: SampleApproval): ApprovalItem => ({
  id: item.id,
  kind: 'sample',
  reference: item.id,
  title: item.title,
  requester: item.requester,
  amount: item.amount,
  category: item.category,
  submitted: item.submitted,
  approver: item.approver,
  status: item.status === 'Pending' ? 'Awaiting approval' : item.status,
  source: item.source,
  canDecide: item.status === 'Pending',
  blockReason: '',
  note: '',
  details: [],
})
