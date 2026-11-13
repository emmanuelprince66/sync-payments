import { useState } from 'react'
import { toast } from 'sonner'
import { downloadCsv } from '@/features/transactions/format'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { walletTransferFees } from '@/lib/transfer-fees'
import { BULK_CSV_HEADER, SAMPLE_BULK_ROWS, type BulkRow } from '../sample'

const parseCsv = (text: string): BulkRow[] => text.split(/\r?\n/).slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))).filter(cells => cells.length >= 4 && cells[0]).map(([name, account, bank, amount, reference]) => ({ name, account, bank, amount: Number(amount) || 0, reference: reference ?? '' }))

/** No bulk endpoint and no bulk approvals exist: the batch is previewed locally only (sample data); nothing is submitted. */
export function useBulkPayments() {
  const money = useFormatMoney()
  const [rows, setRows] = useState<BulkRow[]>(SAMPLE_BULK_ROWS)
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  // Each recipient would be its own wallet transfer, so each carries sink's wallet charge (no stamp duty).
  const fees = rows.reduce((sum, row) => sum + walletTransferFees(row.amount).charges, 0)

  return {
    rows,
    money,
    total: money(total),
    fees: money(fees),
    totalDebit: money(total + fees),
    downloadTemplate: () => downloadCsv('bulk-payment-template', [BULK_CSV_HEADER, ...SAMPLE_BULK_ROWS.map(row => [row.name, row.account, row.bank, row.amount, row.reference])]),
    loadCsv: async (file: File) => {
      const parsed = parseCsv(await file.text())
      if (!parsed.length) { toast.error('No recipients found. Use the CSV template.'); return }
      setRows(parsed)
      toast.success(`${parsed.length} recipients loaded`)
    },
  }
}
