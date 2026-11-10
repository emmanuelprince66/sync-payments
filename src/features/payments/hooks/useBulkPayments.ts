import { useState } from 'react'
import { toast } from 'sonner'
import { downloadCsv } from '@/features/transactions/format'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { useAuthStore } from '@/stores/auth-store'
import { useSampleApprovalsStore } from '@/stores/sample-approvals-store'
import { BULK_CSV_HEADER, BULK_FEE_PER_ROW, SAMPLE_BULK_ROWS, type BulkRow } from '../sample'

const parseCsv = (text: string): BulkRow[] => text.split(/\r?\n/).slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))).filter(cells => cells.length >= 4 && cells[0]).map(([name, account, bank, amount, reference]) => ({ name, account, bank, amount: Number(amount) || 0, reference: reference ?? '' }))

/** No bulk endpoint exists: the batch is previewed locally and queued as a sample approval. */
export function useBulkPayments() {
  const money = useFormatMoney()
  const requester = useAuthStore(state => state.user?.firstname) || 'You'
  const addApproval = useSampleApprovalsStore(state => state.add)
  const [rows, setRows] = useState<BulkRow[]>(SAMPLE_BULK_ROWS)
  const [submitted, setSubmitted] = useState(false)
  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  return {
    rows,
    money,
    total: money(total),
    fees: money(rows.length * BULK_FEE_PER_ROW),
    submitted,
    downloadTemplate: () => downloadCsv('bulk-payment-template', [BULK_CSV_HEADER, ...SAMPLE_BULK_ROWS.map(row => [row.name, row.account, row.bank, row.amount, row.reference])]),
    loadCsv: async (file: File) => {
      const parsed = parseCsv(await file.text())
      if (!parsed.length) { toast.error('No recipients found. Use the CSV template.'); return }
      setRows(parsed)
      setSubmitted(false)
      toast.success(`${parsed.length} recipients loaded`)
    },
    submit: () => {
      addApproval({ id: `BULK-${Date.now().toString().slice(-5)}`, title: 'Bulk payment batch', requester, amount: total, category: 'Payment', submitted: 'Just now', approver: 'Finance admin', status: 'Pending', source: 'Bulk' })
      setSubmitted(true)
      toast.success('Batch added to the approval queue')
    },
  }
}
