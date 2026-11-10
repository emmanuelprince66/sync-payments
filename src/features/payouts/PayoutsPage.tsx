import { Plus } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { NextPayoutCard } from './components/NextPayoutCard'
import { PayoutActivity } from './components/PayoutActivity'
import { PayoutSchedule } from './components/PayoutSchedule'
import { usePayoutsPage } from './hooks/usePayoutsPage'

export default function PayoutsPage() {
  const page = usePayoutsPage()
  return <KitPage>
    <KitPageHeader
      title="Payouts"
      subtitle="Track when collected funds arrive in your operating account."
      actions={<KitButton onClick={page.newPayout}><Plus size={14}/> New payout</KitButton>}
    />
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
      {page.schedule
        ? <>
          <NextPayoutCard next={page.schedule.next}/>
          <PayoutSchedule items={page.schedule.schedule} cadence={page.schedule.cadence}/>
        </>
        : <><CardSkeleton lines={4}/><CardSkeleton lines={4}/></>}
    </div>
    <PayoutActivity dateRange={page.dateRange} onDateRange={page.setDateRange} chart={page.chart} isEmpty={page.isEmpty} isLoading={page.activityLoading} isError={page.activityError} hasBank={page.hasBank} onExport={page.exportCsv}/>
  </KitPage>
}
