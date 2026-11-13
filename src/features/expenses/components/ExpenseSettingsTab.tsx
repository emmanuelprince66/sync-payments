import { KitFilterPills } from '@/components/ui/KitExtras'
import type { ExpenseSettingsSection } from '../hooks/useExpenseTabs'
import { ApprovalRightsSection } from './rules/ApprovalRightsSection'
import { ExpenseRulesSection } from './rules/ExpenseRulesSection'

const SECTIONS: readonly { value: ExpenseSettingsSection; label: string }[] = [
  { value: 'expense-rules', label: 'Expense rules' },
  { value: 'approval-rights', label: 'Approval rights' },
]

const DESCRIPTIONS: Record<ExpenseSettingsSection, string> = {
  'expense-rules': 'Ceilings for money leaving an expense account, and when a payout needs an approver.',
  'approval-rights': 'Who on your team can log, request and approve expenses, and up to how much.',
}

/** Expenses › Settings (owner and admins): the business's expense rules and the team's approval rights. */
export function ExpenseSettingsTab({ section, onSectionChange }: { section: ExpenseSettingsSection; onSectionChange: (section: ExpenseSettingsSection) => void }) {
  return <section className="min-w-0 rounded-2xl border border-border bg-white">
    <div className="border-b border-border p-5">
      <h2 className="text-sm font-extrabold">Expense settings</h2>
      <p className="mt-1 text-[11px] text-muted-foreground">{DESCRIPTIONS[section]}</p>
      <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1"><KitFilterPills value={section} options={SECTIONS} onChange={onSectionChange}/></div>
    </div>
    <div className="max-w-3xl p-5">
      {section === 'expense-rules' ? <ExpenseRulesSection/> : <ApprovalRightsSection/>}
    </div>
  </section>
}
