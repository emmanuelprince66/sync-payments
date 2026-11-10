import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useDeleteSettlementAccount, useSettlementAccounts } from '@/api/banks'
import { kycProgress, useKycStatus } from '@/api/kyc'
import { useBusinessBanks, useCan, useRefreshWallet, useWalletAccount, useWalletBalances, type PaymentBank } from '@/api/transactions'
import { exportTransactionsCsv, maskAccount } from '@/features/transactions/format'
import { useClipboard } from '@/hooks/useClipboard'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { paths } from '@/routes/paths'

const COLORS = ['bg-primary', 'bg-secondary', 'bg-[#356C82]', 'bg-[#9A6A43]']
const SPLIT_COLORS = ['bg-secondary', 'bg-[#91C99D]', 'bg-[#6FA0B5]', 'bg-[#C49168]']
const STATEMENT_ROWS = 100

const purposeOf = (bank: PaymentBank) => (bank.isExpenses ? 'Approved company spend' : bank.is_sub ? 'Branch or department funds' : 'Collections & operations')

/** Treasury view: every account the business holds, plus payout destinations and KYC tier. */
export function useAccountsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const money = useFormatMoney()
  const { code } = useBusinessCurrency()
  const canManage = useCan('manage_bank_details')
  const banks = useBusinessBanks()
  const balances = useWalletBalances(banks.banks)
  const settlement = useSettlementAccounts()
  const removeSettlement = useDeleteSettlementAccount()
  const kyc = useKycStatus()
  const refresh = useRefreshWallet()
  const { copied, copy } = useClipboard()

  const subAccount = useDisclosure()
  const payoutBank = useDisclosure()
  const fund = useDisclosure()
  const [rulesOpen, setRulesOpen] = useState(() => params.get('action') === 'rules')
  const [kycPrompt, setKycPrompt] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Settings in the sidebar links here with ?action=rules, including when this page is already open.
  useEffect(() => {
    if (params.get('action') !== 'rules') return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is the trigger
    setRulesOpen(true)
    setParams(current => { current.delete('action'); return current }, { replace: true })
  }, [params, setParams])

  const account = useWalletAccount({ page: 1, search: '', filter: 'ALL', startDate: '', endDate: '', limit: STATEMENT_ROWS })
  const rows = useMemo(() => account.data?.transactions ?? [], [account.data])
  const pending = rows.filter(row => row.status === 'PENDING').reduce((total, row) => total + row.amount, 0)

  const accounts = banks.banks.map((bank, index) => ({
    id: bank.id,
    name: bank.account_name || 'Account',
    bank: bank.bank_name || 'Bank',
    number: maskAccount(bank.account_number),
    accountNumber: bank.account_number ?? '',
    balance: money(balances.balances[bank.id] ?? 0),
    balanceValue: balances.balances[bank.id] ?? 0,
    purpose: purposeOf(bank),
    color: COLORS[index % COLORS.length],
    selected: bank.id === banks.selectedBankId,
  }))
  const current = accounts.find(item => item.selected) ?? accounts[0] ?? null

  const walletDetails = account.data?.wallet
  const tier = kyc.data?.tier ?? 0

  return {
    canManage,
    loading: banks.loading || balances.loading,
    empty: !banks.loading && accounts.length === 0,
    accounts,
    subCount: accounts.filter((_, index) => banks.banks[index].is_sub).length,
    current,
    select: (id: string) => { if (banks.canSwitchBanks) banks.setSelectedBankId(id) },
    canSwitch: banks.canSwitchBanks,
    flows: { moneyIn: money(account.data?.inflow ?? 0), moneyOut: money(account.data?.outflow ?? 0), pending: money(pending), loading: account.isLoading && !account.data },
    total: money(balances.total),
    split: accounts.map((item, index) => ({ id: item.id, width: balances.total ? Math.max((item.balanceValue / balances.total) * 100, 2) : 100 / accounts.length, color: SPLIT_COLORS[index % SPLIT_COLORS.length] })),
    connections: `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`,
    syncedNote: balances.updatedAt ? `Last synced at ${new Date(balances.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : 'Not synced yet',
    card: current ? { accountNumber: walletDetails?.accountNumber || current.accountNumber, bankName: walletDetails?.bankName || current.bank, accountName: current.name, balance: walletDetails?.balance ?? current.balanceValue } : null,
    payouts: settlement.data ?? [],
    payoutsLoading: settlement.isLoading,
    removePayout: (id: string) => removeSettlement.mutate(id, {
      onSuccess: () => toast.success('Payout account removed'),
      onError: failure => toast.error(errorMessage(failure, 'Could not remove the account')),
    }),
    removing: removeSettlement.isPending,
    currency: code,
    kyc: {
      loading: kyc.isLoading,
      tierLabel: tier > 0 ? `Tier ${tier}` : 'Not verified',
      note: kycProgress(kyc.data).complete ? 'Fully verified' : tier > 0 ? `Upgrade to Tier ${tier + 1} for higher limits` : 'Verify your business to open your account',
      goTo: () => navigate(paths.kyc),
    },
    sync: async () => {
      setSyncing(true)
      await refresh()
      setSyncing(false)
      toast.success('Accounts are up to date')
    },
    syncing,
    transfer: () => {
      if (banks.needsKyc) { setKycPrompt(true); return }
      navigate(paths.payments, { state: { bankId: current?.id } })
    },
    statement: () => {
      if (!rows.length) { toast.info('This account has no transactions yet.'); return }
      exportTransactionsCsv(rows, 'statement')
    },
    copied,
    copyNumber: () => { if (current?.accountNumber) void copy(current.accountNumber) },
    subAccount,
    payoutBank,
    fund,
    rules: { open: rulesOpen, show: () => setRulesOpen(true), close: () => setRulesOpen(false) },
    kycPrompt: { open: kycPrompt, close: () => setKycPrompt(false), verify: () => navigate(paths.kyc) },
  }
}

export type AccountsModel = ReturnType<typeof useAccountsPage>
