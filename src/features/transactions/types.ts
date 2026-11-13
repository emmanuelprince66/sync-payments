/** What a transfer receipt shows (sink: TransferReceiptDetails). */
export type ReceiptDetails = {
  amount: number
  /** Bank charge, stamp duty and the full debit: the API's figures when it sent them, else the preview rules. */
  charges?: number
  stampDuty?: number
  totalDebit?: number
  senderName?: string
  beneficiaryName?: string
  beneficiaryAccount?: string
  beneficiaryBank?: string
  narration?: string
  transactionId?: string
  date: string
  status: string
}
