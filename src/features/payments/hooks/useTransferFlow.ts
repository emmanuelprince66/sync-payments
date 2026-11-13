import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useInitiateTransfer, type InitiatedTransfer } from '@/api/expenses'
import { extractTransactionId, useBeneficiaryEnquiry, useBusinessBanks, useExpenseCategories, useRecentBeneficiaries, useTransfer, useTransferBanks, useWalletBalances, type RecentBeneficiary } from '@/api/transactions'
import { maskAccount } from '@/features/transactions/format'
import type { ReceiptDetails } from '@/features/transactions/types'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { expenseTransferFees, walletTransferFees } from '@/lib/transfer-fees'
import { TRANSFER_DETAIL_FIELDS, transferSchema, type TransferValues } from '../schemas'

/**
 * Two-step transfer, as in sink-inventory: (1) account, beneficiary bank + 10-digit number with an
 * automatic name enquiry, amount, narration; (2) review with the charges, stamp duty and the 4-digit PIN.
 * The review previews the fees (lib/transfer-fees): sink's wallet table for wallet/transfer, and sink's expense
 * estimate (plus the stamp duty the expense route returns) for an expense account, labelled as an estimate.
 * Once a transfer is answered, its own figures are shown.
 * Who may pay from what (sink): wallet accounts need manage_bank_details and can_initiate_expense_transfer;
 * an expense account needs can_initiate_expense_transfer.
 * Main and sub-accounts pay through wallet/transfer; an expense account goes through the expense
 * transfer route, where the backend either releases it or holds it for approval.
 */
export function useTransferFlow({ bankId }: { bankId?: string } = {}) {
  const location = useLocation()
  const banks = useBusinessBanks()
  const { canWalletTransfer, canTransferExpenses } = usePermissions()
  /** The accounts this login may pay from. */
  const payable = useMemo(() => banks.banks.filter(bank => (bank.isExpenses ? canTransferExpenses : canWalletTransfer)), [banks.banks, canTransferExpenses, canWalletTransfer])
  const allowedId = (id: string | null | undefined) => (id && payable.some(bank => bank.id === id) ? id : '')
  const money = useFormatMoney()
  const balances = useWalletBalances(banks.banks)
  // An explicit account (e.g. Transfer on an expense account) wins over one passed through navigation state.
  const stateBank = allowedId(bankId ?? (location.state as { bankId?: string } | null)?.bankId) || undefined
  const defaultBank = allowedId(banks.selectedBankId) || payable[0]?.id || ''

  const [step, setStep] = useState<1 | 2>(1)
  const [submittedForApproval, setSubmittedForApproval] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null)
  const [error, setError] = useState('')

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { fromBankId: stateBank ?? defaultBank, bankCode: '', accountNumber: '', amount: '', categoryId: '', narration: '', pin: '' },
  })
  const [watchedFrom, bankCode, accountNumber, amount, categoryId, narration, pin] = useWatch({ control: form.control, name: ['fromBankId', 'bankCode', 'accountNumber', 'amount', 'categoryId', 'narration', 'pin'] })
  // The form may mount before the business has loaded; fall back to the selected account until one is picked.
  const fromBankId = allowedId(watchedFrom) || stateBank || defaultBank

  const bankList = useTransferBanks()
  const categories = useExpenseCategories()
  const recent = useRecentBeneficiaries(fromBankId || null)
  const enquiry = useBeneficiaryEnquiry(bankCode, accountNumber)
  const transfer = useTransfer()
  const initiate = useInitiateTransfer()

  const bankOptions = useMemo(() => (bankList.data ?? []).map(bank => ({ value: bank.code, label: bank.name })), [bankList.data])
  const bankName = bankOptions.find(option => option.value === bankCode)?.label ?? ''
  const fromBank = banks.banks.find(bank => bank.id === fromBankId) ?? null
  const isExpenseAccount = fromBank?.isExpenses === true
  const fees = isExpenseAccount ? expenseTransferFees(amount) : walletTransferFees(amount)
  const availableBalance = balances.balances[fromBankId] ?? 0
  const beneficiary = enquiry.data ?? null
  const fromLabel = fromBank ? `${fromBank.account_name || 'Account'} ${maskAccount(fromBank.account_number)}` : 'Select an account'

  const reset = () => {
    form.reset({ fromBankId, bankCode: '', accountNumber: '', amount: '', categoryId: '', narration: '', pin: '' })
    setStep(1)
    setError('')
  }

  const next = async () => {
    form.setValue('fromBankId', fromBankId)
    const valid = await form.trigger([...TRANSFER_DETAIL_FIELDS])
    if (!valid) return
    if (!beneficiary?.name) { setError('Verify the beneficiary before continuing.'); return }
    if (!balances.loading && Number(amount) > availableBalance) { setError('Insufficient balance for this transfer.'); return }
    setError('')
    setSubmittedForApproval(false)
    setStep(2)
  }

  const applyBeneficiary = (row: RecentBeneficiary) => {
    // Paid before? Fill bank + number; the name still comes from a fresh enquiry.
    const match = bankOptions.find(option => row.bankCode && option.value === row.bankCode)
    if (match) form.setValue('bankCode', match.value, { shouldValidate: true })
    form.setValue('accountNumber', row.accountNumber, { shouldValidate: true })
    setError('')
    setStep(1)
  }

  const finishDirect = (response: unknown, answered?: InitiatedTransfer) => {
    const amountValue = Number(amount)
    toast.success('Transfer successful')
    // The expense route answers with its charges / stamp_duty / total_debit; the wallet route doesn't, so it keeps the preview.
    const charged = answered?.hasFees ? { charges: answered.charges, stampDuty: answered.stampDuty, totalDebit: answered.totalDebit } : fees
    setReceipt({ amount: amountValue, ...charged, senderName: fromBank?.account_name, beneficiaryName: beneficiary?.name, beneficiaryAccount: accountNumber, beneficiaryBank: bankName, narration, transactionId: extractTransactionId(response) || answered?.reference, date: new Date().toISOString(), status: 'Completed' })
    reset()
  }

  const submit = () => {
    if (pin.length !== 4) { setError('Enter your 4-digit transaction PIN.'); return }
    if (!fromBankId) { toast.error('Select an account before transferring'); return }
    setError('')
    const onError = (failure: unknown) => { setError(errorMessage(failure, 'Transfer failed. Please try again.')); form.setValue('pin', '') }
    if (isExpenseAccount) {
      if (!banks.businessId) return
      initiate.mutate({ businessId: banks.businessId, amount: Number(amount), accountNumber, bankCode, categoryId: categoryId || undefined, narration: narration || undefined, pin }, {
        onSuccess: result => {
          if (result.status === 'SUCCESS') { finishDirect(result, result); return }
          setSubmittedForApproval(true)
          toast.success('Payment submitted for approval')
          reset()
        },
        onError,
      })
      return
    }
    transfer.mutate({ bankId: fromBankId, pin, ref: beneficiary?.ref ?? '', amount, narration, categoryId: categoryId || undefined }, { onSuccess: response => finishDirect(response), onError })
  }

  return {
    /** Some account this login may pay from (lib/access-map: transfer, expenseTransfer). */
    canInitiate: payable.length > 0 || (banks.loading && (canWalletTransfer || canTransferExpenses)),
    /** Expense payouts show sink's estimate; the backend confirms the figures when the payout runs. */
    feesAreEstimate: isExpenseAccount,
    needsKyc: banks.needsKyc,
    step,
    register: form.register,
    errors: form.formState.errors,
    accounts: payable.map(bank => ({ value: bank.id, label: `${bank.account_name || 'Account'} ${maskAccount(bank.account_number)} — ${money(balances.balances[bank.id] ?? 0)}` })),
    accountsLoading: banks.loading,
    fromBankId,
    setFromBank: (id: string) => form.setValue('fromBankId', id, { shouldValidate: true }),
    fromLabel,
    /** The paying account in full, so an expense account's number is visible where money leaves it. */
    fromAccount: fromBank ? { name: fromBank.account_name || 'Account', bank: fromBank.bank_name || 'Bank', number: fromBank.account_number ?? '', isExpense: isExpenseAccount } : null,
    available: money(availableBalance),
    availableLoading: balances.loading,
    isExpenseAccount,
    bank: { options: bankOptions, loading: bankList.isLoading, value: bankCode, name: bankName },
    setBankCode: (code: string) => { form.setValue('bankCode', code, { shouldValidate: true }); setError('') },
    accountNumber,
    setAccountNumber: (value: string) => { form.setValue('accountNumber', value.replace(/\D/g, '').slice(0, 10), { shouldValidate: value.length >= 10 }); setError('') },
    verifying: enquiry.isFetching,
    beneficiary,
    enquiryFailed: enquiry.isError && !enquiry.isFetching,
    recent: {
      rows: recent.data ?? [],
      loading: recent.isLoading,
      apply: applyBeneficiary,
      /** sink's "Recent recipient" picker: the label carries name, bank and number so search finds any of them. */
      options: (recent.data ?? []).map(row => ({ value: `${row.bankCode ?? row.bankName}-${row.accountNumber}`, label: `${row.accountName || 'Beneficiary'} · ${row.bankName} · ${row.accountNumber}` })),
      value: (() => { const row = (recent.data ?? []).find(item => item.accountNumber === accountNumber && (!item.bankCode || item.bankCode === bankCode)); return row ? `${row.bankCode ?? row.bankName}-${row.accountNumber}` : '' })(),
      applyKey: (key: string) => { const row = (recent.data ?? []).find(item => `${item.bankCode ?? item.bankName}-${item.accountNumber}` === key); if (row) applyBeneficiary(row) },
    },
    categories: (categories.data ?? []).map(category => ({ value: category.id, label: category.name })),
    amount: money(Number(amount) || 0),
    charges: money(fees.charges),
    stampDuty: fees.stampDuty ? money(fees.stampDuty) : '',
    total: money(fees.totalDebit || Number(amount) || 0),
    categoryName: categories.data?.find(category => category.id === categoryId)?.name ?? '',
    narration,
    pin,
    setPin: (value: string) => form.setValue('pin', value),
    error,
    next: () => { void next() },
    back: () => { setStep(1); setError('') },
    cancel: reset,
    submit,
    submitting: transfer.isPending || initiate.isPending,
    submittedForApproval,
    receipt,
    closeReceipt: () => setReceipt(null),
  }
}

export type TransferFlow = ReturnType<typeof useTransferFlow>
