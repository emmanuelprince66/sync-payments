import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useBusinessBanks, useRecentBeneficiaries } from '@/api/transactions'
import { usePermissions } from '@/hooks/usePermissions'
import { paths } from '@/routes/paths'
import { useTransferFlow } from './useTransferFlow'

export const PAYMENT_TABS = ['Transfer', 'Bulk payments', 'Beneficiaries'] as const
export type PaymentTab = (typeof PAYMENT_TABS)[number]

export function usePaymentsPage() {
  const navigate = useNavigate()
  const flow = useTransferFlow()
  const banks = useBusinessBanks()
  const beneficiaries = useRecentBeneficiaries(banks.selectedBankId, 50)
  const [tab, setTab] = useState<PaymentTab>('Transfer')
  const [kycDismissed, setKycDismissed] = useState(false)
  const { canWalletTransfer, canManageSetup } = usePermissions()

  return {
    /** Bulk payments are wallet transfers (manage_bank_details + can_initiate_expense_transfer). */
    tabs: PAYMENT_TABS.filter(item => item !== 'Bulk payments' || canWalletTransfer),
    tab,
    setTab,
    flow,
    beneficiaries: {
      rows: beneficiaries.data ?? [],
      loading: beneficiaries.isLoading,
      /** There is no "save beneficiary" endpoint: a beneficiary is someone paid before, so adding one means paying them. */
      addNew: () => { flow.cancel(); setTab('Transfer') },
      payAgain: (row: Parameters<typeof flow.recent.apply>[0]) => { flow.recent.apply(row); setTab('Transfer') },
    },
    kyc: { open: flow.needsKyc && canManageSetup && !kycDismissed, dismiss: () => setKycDismissed(true), verify: () => navigate(paths.kyc) },
  }
}
