import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useApproveExpense, useApproveTransfer, useRejectExpense, useRejectTransfer } from '@/api/expenses'
import { paths } from '@/routes/paths'
import type { ApprovalItem } from '../approval-items'

type Mode = 'review' | 'approve' | 'reject'

/**
 * sink: classifyPinFault. The approve endpoints answer every PIN problem with a 400 and a sentence, and
 * "you have not set your PIN" needs the create-PIN flow rather than a cleared box.
 */
const pinFault = (message: string): 'not-set' | 'invalid' | null => {
  const text = message.toLowerCase()
  if (text.includes('not set') || text.includes('have not set')) return 'not-set'
  if (text.includes('pin')) return 'invalid'
  return null
}

/**
 * Deciding one request, as sink does it: Approve asks for the approver's transaction PIN (a payout is
 * dispatched; a logged expense is only signed off), Reject needs a reason the requester will see.
 */
export function useApprovalDecision() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<ApprovalItem | null>(null)
  const [mode, setMode] = useState<Mode>('review')
  const [pin, setPin] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [needsPin, setNeedsPin] = useState(false)

  const approveExpense = useApproveExpense()
  const approveTransfer = useApproveTransfer()
  const rejectExpense = useRejectExpense()
  const rejectTransfer = useRejectTransfer()

  const reset = () => { setMode('review'); setPin(''); setReason(''); setError(''); setNeedsPin(false) }
  const close = () => { setSelected(null); reset() }

  const onFailure = (failure: unknown) => {
    const message = errorMessage(failure, 'That did not go through. Please try again.')
    const fault = pinFault(message)
    setNeedsPin(fault === 'not-set')
    setError(fault === 'not-set' ? 'You have not set a transaction PIN yet. Create one, then approve.' : message)
    if (fault === 'invalid') setPin('')
  }

  const approve = () => {
    if (!selected) return
    if (pin.length !== 4) { setError('Enter your 4-digit transaction PIN.'); return }
    setError('')
    const options = { onError: onFailure }
    // sink's toasts: "approved and sent" for a payout, plain "approved" for a logged expense (nothing moves).
    if (selected.kind === 'transfer') approveTransfer.mutate({ id: selected.id, pin }, { ...options, onSuccess: () => { toast.success('Transfer approved and sent'); close() } })
    else approveExpense.mutate({ id: selected.id, pin }, { ...options, onSuccess: () => { toast.success('Expense approved'); close() } })
  }

  const reject = () => {
    if (!selected) return
    if (!reason.trim()) { setError('Say why, so whoever raised it knows what to fix.'); return }
    setError('')
    const input = { id: selected.id, reason: reason.trim() }
    const options = { onError: onFailure, onSuccess: () => { toast.success(selected.kind === 'transfer' ? 'Transfer rejected' : 'Expense rejected'); close() } }
    if (selected.kind === 'transfer') rejectTransfer.mutate(input, options)
    else rejectExpense.mutate(input, options)
  }

  return {
    selected,
    mode,
    pin,
    setPin,
    reason,
    setReason: (value: string) => { setReason(value); if (error) setError('') },
    error,
    needsPin,
    createPin: () => { close(); navigate(`${paths.accounts}?action=rules`) },
    open: (item: ApprovalItem) => { reset(); setSelected(item) },
    close,
    startApprove: () => { setError(''); setMode('approve') },
    startReject: () => { setError(''); setMode('reject') },
    back: () => { setMode('review'); setError(''); setNeedsPin(false) },
    approve,
    reject,
    submitting: approveExpense.isPending || approveTransfer.isPending || rejectExpense.isPending || rejectTransfer.isPending,
  }
}

export type ApprovalDecision = ReturnType<typeof useApprovalDecision>
