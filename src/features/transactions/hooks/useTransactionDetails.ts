import { useCallback, useState } from 'react'
// Reconciliation is switched off for now; restore these with `reconcile` below.
// import { useNavigate } from 'react-router'
// import { paths } from '@/routes/paths'
import type { WalletTrx } from '@/api/transactions'
import { trxCustomer, trxStatus } from '../format'
import type { ReceiptDetails } from '../types'

/** Payment record + receipt, opened from any transaction table. */
export function useTransactionDetails() {
  // const navigate = useNavigate()
  const [selected, setSelected] = useState<WalletTrx | null>(null)
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null)

  return {
    selected,
    receipt,
    open: useCallback((trx: WalletTrx) => setSelected(trx), []),
    close: () => setSelected(null),
    closeReceipt: () => setReceipt(null),
    showReceipt: (trx: WalletTrx) => {
      setSelected(null)
      setReceipt({ amount: trx.amount, beneficiaryName: trxCustomer(trx), beneficiaryAccount: trx.accountNumber, beneficiaryBank: trx.bankName, narration: trx.description, transactionId: trx.reference, date: trx.createdAt, status: trxStatus(trx.status) })
    },
    // Reconciliation is switched off for now.
    // reconcile: () => { setSelected(null); navigate(paths.reconciliation) },
  }
}

export type TransactionDetailsModel = ReturnType<typeof useTransactionDetails>
