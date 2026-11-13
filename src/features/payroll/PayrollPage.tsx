import { Plus } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { CardSkeleton, StatCardsSkeleton } from '@/components/ui/Skeleton'
import { SampleDataBadge } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { AddEmployeeModal } from './components/AddEmployeeModal'
import { PayrollEmployees } from './components/PayrollEmployees'
import { PayrollOverview } from './components/PayrollOverview'
import { PayrollTaxes } from './components/PayrollTaxes'
import { PayRun } from './components/PayRun'
import { PAYROLL_TABS, usePayrollPage } from './hooks/usePayrollPage'

export default function PayrollPage() {
  const page = usePayrollPage()
  return <KitPage>
    <KitPageHeader
      eyebrow="People operations"
      title="Payroll"
      subtitle="Employees, compensation, deductions, taxes, and direct deposit."
      badge={<SampleDataBadge/>}
      actions={<KitButton onClick={page.openPayRun}><Plus size={14}/> Run payroll</KitButton>}
    />
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {PAYROLL_TABS.map(item => <button key={item} type="button" onClick={() => page.setTab(item)} className={cn('shrink-0 border-b-2 px-4 py-3 text-[10px] font-extrabold', page.tab === item ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground')}>{item}</button>)}
    </div>
    {!page.data
      ? <div className="flex flex-col gap-5"><StatCardsSkeleton count={4} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"/><CardSkeleton lines={4}/></div>
      : <>
        {page.tab === 'Overview' && <PayrollOverview data={page.data} totals={page.totals} onOpenRun={page.openPayRun} onTask={page.setTab}/>}
        {page.tab === 'Employees' && <PayrollEmployees employees={page.data.employees} onAdd={page.addEmployee.open}/>}
        {page.tab === 'Pay runs' && <PayRun data={page.data} totals={page.totals}/>}
        {page.tab === 'Taxes & filings' && <PayrollTaxes data={page.data}/>}
      </>}
    <AddEmployeeModal open={page.addEmployee.isOpen} onClose={page.addEmployee.close}/>
  </KitPage>
}
