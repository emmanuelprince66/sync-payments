import { Send } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { TransferModal } from '@/features/payments/components/TransferModal'
import { PayoutActivity } from './components/PayoutActivity'
import { RecentTransfers } from './components/RecentTransfers'
import { TransferBalanceCard } from './components/TransferBalanceCard'
import { usePayoutsPage } from './hooks/usePayoutsPage'

export default function PayoutsPage() {
  const page = usePayoutsPage()
  return <KitPage>
    <KitPageHeader
      title="Payouts"
      subtitle="Transfer money out of your wallet to any bank account."
      actions={<KitButton onClick={page.transfer.open}><Send size={14}/> New transfer</KitButton>}
    />
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
      <TransferBalanceCard balance={page.balance} sent={page.sent} sentNote={page.sentNote} loading={page.activityLoading} onTransfer={page.transfer.open}/>
      <RecentTransfers rows={page.recent} loading={page.activityLoading} money={page.money}/>
    </div>
    <PayoutActivity dateRange={page.dateRange} onDateRange={page.setDateRange} chart={page.chart} isEmpty={page.isEmpty} isLoading={page.activityLoading} isError={page.activityError} hasBank={page.hasBank} onExport={page.exportCsv}/>
    <TransferModal open={page.transfer.isOpen} onClose={page.transfer.close}/>
  </KitPage>
}
