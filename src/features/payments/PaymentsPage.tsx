import { CheckCircle2 } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { cn } from '@/lib/cn'
import { KycPromptModal } from '@/features/accounts/components/KycPromptModal'
import { BeneficiariesTab } from './components/BeneficiariesTab'
import { BulkTab } from './components/BulkTab'
import { TransferTab } from './components/TransferTab'
import { PAYMENT_TABS, usePaymentsPage } from './hooks/usePaymentsPage'

export default function PaymentsPage() {
  const page = usePaymentsPage()
  return <KitPage>
    <KitPageHeader
      eyebrow="Money out"
      title="Payments"
      subtitle="Transfer funds, pay many recipients, and control every release with approval rules."
      actions={<div className="flex rounded-lg border border-border bg-white p-1">
        {PAYMENT_TABS.map(item => <button key={item} type="button" aria-pressed={page.tab === item} onClick={() => page.setTab(item)} className={cn('flex-1 whitespace-nowrap rounded-md px-2.5 py-2 text-[10px] font-extrabold sm:px-4', page.tab === item ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted')}>{item}</button>)}
      </div>}
    />
    {page.flow.submittedForApproval && <div className="flex items-center gap-3 rounded-lg border border-secondary/25 bg-accent p-4"><CheckCircle2 size={17} className="shrink-0 text-secondary"/><div><p className="text-xs font-extrabold">Payment submitted for approval</p><p className="mt-1 text-[9px] text-muted-foreground">Funds remain in the account until an approver releases the request.</p></div></div>}
    {page.tab === 'Transfer' && <TransferTab flow={page.flow}/>}
    {page.tab === 'Bulk payments' && <BulkTab/>}
    {page.tab === 'Beneficiaries' && <BeneficiariesTab rows={page.beneficiaries.rows} loading={page.beneficiaries.loading} onAdd={page.beneficiaries.addNew} onPay={page.beneficiaries.payAgain}/>}
    <KycPromptModal open={page.kyc.open} onClose={page.kyc.dismiss} onVerify={page.kyc.verify}/>
  </KitPage>
}
