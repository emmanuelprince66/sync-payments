import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useBusinessBanks, useCreateSubAccount, type CreatedSubAccount } from '@/api/transactions'
import { useClipboard } from '@/hooks/useClipboard'

export type CreateStep = 'intro' | 'setup' | 'done'

/** Every expense account's name starts with this, shown in the field so the name approved is the name created (sink). */
export const EXPENSE_PREFIX = 'Expense'

/** Someone typing "Expense Marketing" into a field that already shows "Expense" wants one prefix, not two. */
const withoutPrefix = (value: string) => value.replace(/^\s*expenses?\s+/i, '')

/**
 * sink's CreateExpenseAccountModal, step by step: intro → setup (fund from + name) → done (the new account's details).
 * POST wallet/create_sub_account/{business_id}/ { previous_account: <funding account NUMBER>, branch: "Expense <name>", is_expenses: true }
 */
export function useCreateExpenseAccount(onClose: () => void) {
  const banks = useBusinessBanks()
  const create = useCreateSubAccount()
  const { copy } = useClipboard()
  const [step, setStep] = useState<CreateStep>('intro')
  const [fundFrom, setFundFrom] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedSubAccount | null>(null)
  // Expense accounts that existed before submitting: if the response has no account number, the new one is the extra bank.
  const [knownIds, setKnownIds] = useState<ReadonlySet<string>>(() => new Set())

  // Only real business accounts fund an expense account, and only ones with a number (previous_account is that number).
  const fundingAccounts = useMemo(() => banks.banks.filter(bank => !bank.is_sub && bank.account_number), [banks.banks])

  const fresh = banks.banks.find(bank => bank.isExpenses && !knownIds.has(bank.id))
  const details = created && {
    accountNumber: created.accountNumber || fresh?.account_number || '',
    accountName: created.accountName || fresh?.account_name || '',
    bankName: created.bankName || fresh?.bank_name || '',
  }

  const reset = () => { setStep('intro'); setFundFrom(''); setName(''); setError(''); setCreated(null) }
  const close = () => { reset(); onClose() }

  const submit = () => {
    setError('')
    if (!fundFrom) { setError('Choose the account to fund this from.'); return }
    if (!name.trim()) { setError('Give this expense account a name.'); return }
    if (!banks.businessId) { setError('Select a business first.'); return }
    setKnownIds(new Set(banks.banks.filter(bank => bank.isExpenses).map(bank => bank.id)))
    create.mutate({ businessId: banks.businessId, previousAccount: fundFrom, branch: `${EXPENSE_PREFIX} ${name.trim()}`, isExpenses: true }, {
      onSuccess: result => { toast.success('Expense account created'); setCreated(result); setStep('done') },
      onError: failure => setError(errorMessage(failure, 'Could not create the expense account. Please try again.')),
    })
  }

  return {
    step,
    title: step === 'intro' ? 'Create an expense account' : step === 'setup' ? 'Set up your expense account' : 'Your expense account is ready',
    next: () => setStep('setup'),
    back: () => { setError(''); setStep('intro') },
    fundingLoading: banks.loading,
    fundingOptions: fundingAccounts.map(bank => ({ value: bank.account_number as string, label: `${bank.bank_name || 'Bank'} · ${bank.account_number}` })),
    fundFrom,
    setFundFrom: (value: string) => { setFundFrom(value); setError('') },
    name,
    setName: (value: string) => { setName(withoutPrefix(value)); setError('') },
    preview: name.trim() ? `${EXPENSE_PREFIX} ${name.trim()}` : '',
    error,
    submit,
    submitting: create.isPending,
    canSubmit: fundingAccounts.length > 0,
    details: details
      ? [
        { label: 'Account number', value: details.accountNumber, mono: true },
        { label: 'Account name', value: details.accountName },
        ...(details.bankName ? [{ label: 'Bank', value: details.bankName }] : []),
      ].map(row => ({ ...row, value: row.value || '—' }))
      : [],
    copy: (label: string, value: string) => { void copy(value).then(() => toast.success(`${label} copied`)) },
    close,
  }
}

export type CreateExpenseAccountModel = ReturnType<typeof useCreateExpenseAccount>
