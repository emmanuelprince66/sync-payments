const LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Awaiting approval',
  PENDING_OWNER_APPROVAL: 'Awaiting owner',
  PENDING: 'Awaiting approval',
  APPROVED: 'Approved',
  COMPLETED: 'Approved',
  SUCCESS: 'Paid',
  PROCESSING: 'Processing',
  REJECTED: 'Rejected',
  FAILED: 'Failed',
}

export const expenseStatusLabel = (status: string) => LABELS[status] ?? (status ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ') : 'Recorded')

/** The pill colours from the design's expense table. */
export const expenseStatusClass = (status: string) => {
  const label = expenseStatusLabel(status)
  if (label.startsWith('Awaiting')) return 'bg-[#FFF6E4] text-[#A76700]'
  if (label === 'Paid' || label === 'Processing') return 'bg-[#E7F1FC] text-[#1C6FA8]'
  if (label === 'Rejected' || label === 'Failed') return 'bg-[#FDEAEA] text-[#C72D34]'
  return 'bg-accent text-secondary'
}

export const EXPENSE_STATUS_OPTIONS = [
  { value: 'PENDING_APPROVAL', label: 'Awaiting approval' },
  { value: 'PENDING_OWNER_APPROVAL', label: 'Awaiting owner' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]
