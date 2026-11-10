import type { TransactionDetailsModel } from '../hooks/useTransactionDetails'
import { ReceiptModal } from './ReceiptModal'
import { TransactionModal } from './TransactionModal'

/** The two dialogs a transaction row opens. */
export function TransactionDialogs({ details, accountLabel }: { details: TransactionDetailsModel; accountLabel: string }) {
  return <>
    <TransactionModal trx={details.selected} accountLabel={accountLabel} onClose={details.close} onReceipt={details.showReceipt} onReconcile={details.reconcile}/>
    <ReceiptModal receipt={details.receipt} onClose={details.closeReceipt}/>
  </>
}
