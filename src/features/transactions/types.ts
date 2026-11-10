/** What a transfer receipt shows (sink: TransferReceiptDetails). */
export type ReceiptDetails = {
  amount: number
  senderName?: string
  beneficiaryName?: string
  beneficiaryAccount?: string
  beneficiaryBank?: string
  narration?: string
  transactionId?: string
  date: string
  status: string
}
