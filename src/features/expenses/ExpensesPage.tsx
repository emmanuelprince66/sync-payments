import { Clock3, CreditCard, Download, Plus, Settings, ShieldCheck, UserCheck } from 'lucide-react'
import { StatTile, StatTileSkeleton } from '@/components/ui/KitExtras'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { TransferModal } from '@/features/payments/components/TransferModal'
import { cn } from '@/lib/cn'
import { ApprovalDecisionModal } from './components/ApprovalDecisionModal'
import { ApprovalsTab } from './components/ApprovalsTab'
import { BudgetsTab } from './components/BudgetsTab'
import { CreateExpenseAccountModal } from './components/CreateExpenseAccountModal'
import { ExpenseAccountCard, ExpenseAccountsTab } from './components/ExpenseAccounts'
import { AuditTrailModal, CategoriesModal, ExpenseDetailsModal } from './components/ExpenseDialogs'
import { ExpenseForm } from './components/ExpenseForm'
import { BudgetCard, InlineApproval, OperatingCard } from './components/ExpensePanels'
import { ExpenseSettingsTab } from './components/ExpenseSettingsTab'
import { ExpenseTable } from './components/ExpenseTable'
import { PendingApprovalsBanner } from './components/PendingApprovalsBanner'
import { useExpenseAccounts } from './hooks/useExpenseAccounts'
import { useExpenseTabs, type ExpenseTab } from './hooks/useExpenseTabs'
import { useExpensesPage } from './hooks/useExpensesPage'

function ExpenseTabs({ tabs, tab, pendingCount, onChange }: { tabs: readonly { value: ExpenseTab; label: string }[]; tab: ExpenseTab; pendingCount: number; onChange: (tab: ExpenseTab) => void }) {
  return <div role="tablist" aria-label="Expenses sections" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
    {tabs.map(item => {
      const active = tab === item.value
      return <button key={item.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(item.value)} className={cn('-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-[11px] font-extrabold transition-colors', active ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
        {item.value === 'settings' && <Settings size={13}/>}
        {item.label}
        {item.value === 'approvals' && pendingCount > 0 && <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[9px] font-extrabold', active ? 'bg-secondary text-white' : 'bg-[#FFF1D2] text-[#A76700]')}>{pendingCount}</span>}
      </button>
    })}
  </div>
}

export default function ExpensesPage() {
  const page = useExpensesPage()
  const tabs = useExpenseTabs()
  const accounts = useExpenseAccounts()
  const openSettings = tabs.canOpenSettings ? () => tabs.openSettings('expense-rules') : undefined
  const payFromId = accounts.canTransfer ? accounts.selected?.id : undefined

  return <KitPage>
    <KitPageHeader
      title="Expenses"
      subtitle="Control company spend from request through approval and payment."
      actions={<div className="flex flex-wrap gap-2">
        {tabs.tab === 'expenses' && <KitButton variant="secondary" onClick={page.exportCsv}><Download size={14}/> Export</KitButton>}
        {tabs.canOpenSettings && tabs.tab !== 'settings' && <KitButton variant="secondary" onClick={openSettings}><Settings size={14}/> Settings</KitButton>}
        {page.permissions.canLog && <KitButton onClick={page.form.start}><Plus size={14}/> New expense</KitButton>}
      </div>}
    />

    <ExpenseTabs tabs={tabs.tabs} tab={tabs.tab} pendingCount={tabs.pendingCount} onChange={tabs.setTab}/>

    {tabs.tab === 'accounts' && <ExpenseAccountsTab model={accounts} onCreate={accounts.create.open} onTransfer={accounts.transfer.start}/>}
    {tabs.tab === 'approvals' && <ApprovalsTab/>}
    {tabs.tab === 'budgets' && <BudgetsTab/>}
    {tabs.tab === 'settings' && <ExpenseSettingsTab section={tabs.section} onSectionChange={tabs.setSection}/>}
    {tabs.tab === 'expenses' && <>
      <PendingApprovalsBanner onOpen={() => tabs.setTab('approvals')}/>

      <ExpenseAccountCard model={accounts} onCreate={accounts.create.open} onTransfer={accounts.transfer.start}/>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(4,minmax(0,1fr))]">
        {page.statsLoading
          ? Array.from({ length: 4 }, (_, index) => <StatTileSkeleton key={index}/>)
          : <>
            <StatTile label="Month to date" value={page.stats.month} note={page.stats.monthNote} icon={CreditCard}/>
            <StatTile label="Awaiting approval" value={page.stats.awaiting} note={page.stats.awaitingNote} icon={Clock3} tone="amber"/>
            <StatTile label="Approved" value={page.stats.approved} note={page.stats.approvedNote} icon={UserCheck} tone="blue"/>
            <StatTile label="Policy savings" value={page.stats.savings} note={page.stats.savingsNote} icon={ShieldCheck}/>
          </>}
      </div>

      <OperatingCard page={page}/>
      <InlineApproval page={page} onTransfer={payFromId ? () => accounts.transfer.start(payFromId) : undefined}/>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,.55fr)]">
        <ExpenseTable page={page}/>
        <BudgetCard page={page} onManageBudgets={() => tabs.setTab('budgets')} onOpenSettings={openSettings}/>
      </div>
    </>}

    {page.form.open && <ExpenseForm draft={page.form.draft} editing={page.form.editing} onClose={page.form.close} onDone={page.form.done}/>}
    <ExpenseDetailsModal expense={page.viewing} canEdit={page.permissions.canLog} onClose={page.closeView} onEdit={page.edit} onReview={page.review}/>
    <AuditTrailModal open={page.audit.isOpen} onClose={page.audit.close}/>
    <CategoriesModal open={page.categoriesModal.isOpen} onClose={page.categoriesModal.close} onManageBudgets={() => { page.categoriesModal.close(); tabs.setTab('budgets') }}/>
    <ApprovalDecisionModal decision={page.decision}/>
    <CreateExpenseAccountModal open={accounts.create.isOpen} onClose={accounts.create.close}/>
    <TransferModal open={accounts.transfer.open} bankId={accounts.transfer.bankId} onClose={accounts.transfer.close}/>
  </KitPage>
}
