import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useApproveExpense, useApproveTransfer, useRejectExpense, useRejectTransfer } from '@/api/expenses'
import { useSampleApprovalsStore } from '@/stores/sample-approvals-store'
import type { ApprovalItem } from '../approval-items'

type Mode = 'review' | 'approve' | 'reject'

const WRONG_PIN = /pin/i

/**
 * Deciding one item. Approving a transfer dispatches the payout; approving a logged
 * expense is bookkeeping only (sink keeps these apart). Both need the approver's PIN.
 * Sample items only change the session-only store.
 */
export function useApprovalDecision() {
  const [selected, setSelected] = useState<ApprovalItem | null>(null)
  const [mode, setMode] = useState<Mode>('review')
  const [pin, setPin] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const approveExpense = useApproveExpense()
  const approveTransfer = useApproveTransfer()
  const rejectExpense = useRejectExpense()
  const rejectTransfer = useRejectTransfer()
  const updateSample = useSampleApprovalsStore(state => state.updateStatus)

  const close = () => { setSelected(null); setMode('review'); setPin(''); setReason(''); setError('') }

  const onFailure = (failure: unknown) => {
    const message = errorMessage(failure, 'That did not go through. Please try again.')
    setError(message)
    if (WRONG_PIN.test(message)) setPin('')
  }

  const approve = () => {
    if (!selected) return
    if (selected.kind === 'sample') {
      updateSample(selected.id, 'Approved')
      toast.success('Marked approved. This is sample data, so no money moved.')
      close()
      return
    }
    if (pin.length !== 4) { setError('Enter your 4-digit transaction PIN.'); return }
    setError('')
    const options = { onError: onFailure }
    if (selected.kind === 'transfer') approveTransfer.mutate({ id: selected.id, pin }, { ...options, onSuccess: () => { toast.success('Transfer approved and sent to the bank'); close() } })
    else approveExpense.mutate({ id: selected.id, pin }, { ...options, onSuccess: () => { toast.success('Expense approved'); close() } })
  }

  const reject = () => {
    if (!selected) return
    if (selected.kind === 'sample') {
      updateSample(selected.id, 'Rejected')
      toast.success('Marked rejected')
      close()
      return
    }
    if (!reason.trim()) { setError('Give a reason so the requester knows what to change.'); return }
    setError('')
    const input = { id: selected.id, reason: reason.trim() }
    const options = { onError: onFailure, onSuccess: () => { toast.success('Request rejected'); close() } }
    if (selected.kind === 'transfer') rejectTransfer.mutate(input, options)
    else rejectExpense.mutate(input, options)
  }

  return {
    selected,
    mode,
    pin,
    setPin,
    reason,
    setReason,
    error,
    open: (item: ApprovalItem) => setSelected(item),
    close,
    startApprove: () => { setError(''); if (selected?.kind === 'sample') approve(); else setMode('approve') },
    startReject: () => { setError(''); if (selected?.kind === 'sample') reject(); else setMode('reject') },
    back: () => { setMode('review'); setError('') },
    approve,
    reject,
    submitting: approveExpense.isPending || approveTransfer.isPending || rejectExpense.isPending || rejectTransfer.isPending,
  }
}

export type ApprovalDecision = ReturnType<typeof useApprovalDecision>
