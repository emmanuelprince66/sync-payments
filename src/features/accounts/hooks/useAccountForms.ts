import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useAddSettlementAccount } from '@/api/banks'
import { useBeneficiaryEnquiry, useBusinessBanks, useCreateSubAccount, useTransferBanks } from '@/api/transactions'
import { maskAccount } from '@/features/transactions/format'
import { payoutBankSchema, subAccountSchema, type PayoutBankValues, type SubAccountValues } from '../schemas'

/** sink: create sub account; `previous_account` is the funding account's NUMBER, `is_expenses` makes it an expense account. */
export function useSubAccountForm(onDone: () => void) {
  const banks = useBusinessBanks()
  const create = useCreateSubAccount()
  const form = useForm<SubAccountValues>({ resolver: zodResolver(subAccountSchema), defaultValues: { previousAccount: '', branch: '', isExpenses: false } })

  return {
    register: form.register,
    errors: form.formState.errors,
    fundingOptions: banks.banks.filter(bank => bank.account_number).map(bank => ({ value: bank.account_number as string, label: `${bank.account_name || 'Account'} ${maskAccount(bank.account_number)}` })),
    submitting: create.isPending,
    close: () => { form.reset(); onDone() },
    onSubmit: form.handleSubmit(values => {
      if (!banks.businessId) { toast.error('Select a business first'); return }
      create.mutate({ businessId: banks.businessId, previousAccount: values.previousAccount, branch: values.isExpenses ? `Expense ${values.branch}` : values.branch, isExpenses: values.isExpenses }, {
        onSuccess: () => { toast.success('Account created'); form.reset(); onDone() },
        onError: failure => toast.error(errorMessage(failure, 'Could not create the account')),
      })
    }),
  }
}

/** Adds a payout destination; the account name comes from the bank enquiry. */
export function usePayoutBankForm(onDone: () => void) {
  const bankList = useTransferBanks()
  const add = useAddSettlementAccount()
  const form = useForm<PayoutBankValues>({ resolver: zodResolver(payoutBankSchema), defaultValues: { bankCode: '', accountNumber: '' } })
  const [bankCode, accountNumber] = useWatch({ control: form.control, name: ['bankCode', 'accountNumber'] })
  const enquiry = useBeneficiaryEnquiry(bankCode, accountNumber)
  const accountName = enquiry.data?.name ?? ''

  return {
    register: form.register,
    errors: form.formState.errors,
    options: (bankList.data ?? []).map(bank => ({ value: bank.code, label: bank.name })),
    loadingBanks: bankList.isLoading,
    accountName,
    verifying: enquiry.isFetching,
    verifyFailed: enquiry.isError && !enquiry.isFetching,
    submitting: add.isPending,
    close: () => { form.reset(); onDone() },
    onSubmit: form.handleSubmit(values => {
      const bankName = bankList.data?.find(bank => bank.code === values.bankCode)?.name
      if (!bankName || !accountName) { toast.error('Verify the account before saving it'); return }
      add.mutate({ bankName, accountNumber: values.accountNumber, accountName }, {
        onSuccess: () => { toast.success('Payout account added'); form.reset(); onDone() },
        onError: failure => toast.error(errorMessage(failure, 'Could not add the account')),
      })
    }),
  }
}
