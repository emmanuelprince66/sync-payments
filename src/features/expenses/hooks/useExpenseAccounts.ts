import { useMemo, useState } from 'react'
import { useExpensePermissions } from '@/api/expenses'
import { useBusinessBanks, useCan, useWalletBalances, type PaymentBank } from '@/api/transactions'
import { useClipboard } from '@/hooks/useClipboard'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney } from '@/hooks/useFormatMoney'

/**
 * A name short enough for a picker (sink: expenseAccountLabel). The bank returns "<Business>-Expense <name>";
 * the business part is the same on every account, so the "Expense …" part is what tells them apart.
 */
export const expenseAccountLabel = (account?: Pick<PaymentBank, 'account_name' | 'account_number'> | null) => {
  const full = account?.account_name?.trim()
  if (!full) return account?.account_number || 'Expense account'
  const marker = full.search(/expenses?\s/i)
  if (marker > -1) return full.slice(marker)
  const dash = full.lastIndexOf('-')
  return dash > -1 ? full.slice(dash + 1).trim() : full
}

export type ExpenseAccountRow = {
  id: string
  label: string
  fullName: string
  bank: string
  accountNumber: string
  balance: string
  balanceValue: number
}

/**
 * The business's expense accounts (sink: useExpenseAccounts): only banks flagged is_expenses, read from the live
 * business payload, each with its own balance. A business may hold several, so one is "selected" for the header
 * card and for transfers.
 */
export function useExpenseAccounts() {
  const money = useFormatMoney()
  const banks = useBusinessBanks()
  const { isAdmin, canTransfer } = useExpensePermissions()
  const canManageBanks = useCan('manage_bank_details')
  const expenseBanks = useMemo(() => banks.banks.filter(bank => bank.isExpenses), [banks.banks])
  const balances = useWalletBalances(expenseBanks)
  const [chosenId, setChosenId] = useState('')
  const { copy, copied } = useClipboard()
  const [copiedId, setCopiedId] = useState('')
  const create = useDisclosure()
  // The account a transfer dialog is open on; '' when closed.
  const [transferBankId, setTransferBankId] = useState('')

  const accounts: ExpenseAccountRow[] = expenseBanks.map(bank => ({
    id: bank.id,
    label: expenseAccountLabel(bank),
    fullName: bank.account_name || 'Expense account',
    bank: bank.bank_name || 'Bank',
    accountNumber: bank.account_number ?? '',
    balance: money(balances.balances[bank.id] ?? 0),
    balanceValue: balances.balances[bank.id] ?? 0,
  }))
  // A stored choice that no longer exists falls back to the first account.
  const selected = accounts.find(account => account.id === chosenId) ?? accounts[0] ?? null

  return {
    loading: banks.loading,
    balancesLoading: balances.loading,
    accounts,
    selected,
    select: setChosenId,
    hasAccount: accounts.length > 0,
    hasMultiple: accounts.length > 1,
    total: money(balances.total),
    /** sink offers creation from the Expenses header; only people who can open accounts see it here. */
    canCreate: isAdmin || canManageBanks,
    canTransfer,
    create,
    transfer: { open: Boolean(transferBankId), bankId: transferBankId, start: (id: string) => setTransferBankId(id), close: () => setTransferBankId('') },
    copiedId: copied ? copiedId : '',
    copyNumber: (account: ExpenseAccountRow) => {
      if (!account.accountNumber) return
      setCopiedId(account.id)
      void copy(account.accountNumber)
    },
  }
}

export type ExpenseAccountsModel = ReturnType<typeof useExpenseAccounts>
