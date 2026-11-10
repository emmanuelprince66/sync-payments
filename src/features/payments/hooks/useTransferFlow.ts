import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { estimateExpenseCharges, useInitiateTransfer } from '@/api/expenses'
import { extractTransactionId, transferCharge, useBeneficiaryEnquiry, useBusinessBanks, useCan, useExpenseCategories, useRecentBeneficiaries, useTransfer, useTransferBanks, useWalletBalances, type RecentBeneficiary } from '@/api/transactions'
import { maskAccount } from '@/features/transactions/format'
import type { ReceiptDetails } from '@/features/transactions/types'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { TRANSFER_DETAIL_FIELDS, transferSchema, type TransferValues } from '../schemas'

/**
 * Two-step transfer, as in sink-inventory: (1) account, beneficiary bank + 10-digit number with an
 * automatic name enquiry, amount, narration; (2) review with the fee and the 4-digit PIN.
 * Main and sub-accounts pay through wallet/transfer; an expense account goes through the expense
 * transfer route, where the backend either releases it or holds it for approval.
 */
export function useTransferFlow() {
  const location = useLocation()
  const banks = useBusinessBanks()
  const canInitiate = useCan('can_initiate_expense_transfer')
  const money = useFormatMoney()
  const balances = useWalletBalances(banks.banks)
  const stateBank = (location.state as { bankId?: string } | null)?.bankId

  const [step, setStep] = useState<1 | 2>(1)
  const [submittedForApproval, setSubmittedForApproval] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null)
  const [error, setError] = useState('')

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { fromBankId: stateBank ?? banks.selectedBankId ?? '', bankCode: '', accountNumber: '', amount: '', categoryId: '', narration: '', pin: '' },
  })
  const [watchedFrom, bankCode, accountNumber, amount, categoryId, narration, pin] = useWatch({ control: form.control, name: ['fromBankId', 'bankCode', 'accountNumber', 'amount', 'categoryId', 'narration', 'pin'] })
  // The form may mount before the business has loaded; fall back to the selected account until one is picked.
  const fromBankId = watchedFrom || stateBank || banks.selectedBankId || ''

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
  const fee = isExpenseAccount ? estimateExpenseCharges(Number(amount)) : transferCharge(amount)
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

  const finishDirect = (response: unknown) => {
    const amountValue = Number(amount)
    toast.success('Transfer successful')
    setReceipt({ amount: amountValue, senderName: fromBank?.account_name, beneficiaryName: beneficiary?.name, beneficiaryAccount: accountNumber, beneficiaryBank: bankName, narration, transactionId: extractTransactionId(response), date: new Date().toISOString(), status: 'Completed' })
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
          if (result.status === 'SUCCESS') { finishDirect(result); return }
          setSubmittedForApproval(true)
          toast.success('Payment submitted for approval')
          reset()
        },
        onError,
      })
      return
    }
    transfer.mutate({ bankId: fromBankId, pin, ref: beneficiary?.ref ?? '', amount, narration, categoryId: categoryId || undefined }, { onSuccess: finishDirect, onError })
  }

  return {
    canInitiate,
    needsKyc: banks.needsKyc,
    step,
    register: form.register,
    errors: form.formState.errors,
    accounts: banks.banks.map(bank => ({ value: bank.id, label: `${bank.account_name || 'Account'} ${maskAccount(bank.account_number)} — ${money(balances.balances[bank.id] ?? 0)}` })),
    accountsLoading: banks.loading,
    fromBankId,
    setFromBank: (id: string) => form.setValue('fromBankId', id, { shouldValidate: true }),
    fromLabel,
    available: money(balances.balances[fromBankId] ?? 0),
    availableLoading: balances.loading,
    isExpenseAccount,
    bank: { options: bankOptions, loading: bankList.isLoading, value: bankCode, name: bankName },
    setBankCode: (code: string) => { form.setValue('bankCode', code, { shouldValidate: true }); setError('') },
    accountNumber,
    setAccountNumber: (value: string) => { form.setValue('accountNumber', value.replace(/\D/g, '').slice(0, 10), { shouldValidate: value.length >= 10 }); setError('') },
    verifying: enquiry.isFetching,
    beneficiary,
    enquiryFailed: enquiry.isError && !enquiry.isFetching,
    recent: { rows: recent.data ?? [], loading: recent.isLoading, apply: applyBeneficiary },
    categories: (categories.data ?? []).map(category => ({ value: category.id, label: category.name })),
    amount: money(Number(amount) || 0),
    fee: money(fee),
    total: money((Number(amount) || 0) + fee),
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
