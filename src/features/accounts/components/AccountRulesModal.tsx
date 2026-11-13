import { KeyRound } from 'lucide-react'
import { useExpensePermissions } from '@/api/expenses'
import { ApprovalRightsSection } from '@/features/expenses/components/rules/ApprovalRightsSection'
import { ExpenseRulesSection } from '@/features/expenses/components/rules/ExpenseRulesSection'
import { KitFilterPills, KitModal } from '@/components/ui/KitExtras'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { usePinManager, type PinView } from '../hooks/usePinManager'
import { RULES_SECTIONS, type RulesSection } from '../rules-sections'

const pinInput = { type: 'password', inputMode: 'numeric', maxLength: 4, autoComplete: 'off', placeholder: '••••' } as const

const VIEWS: readonly { value: PinView; label: string }[] = [
  { value: 'change', label: 'Change PIN' },
  { value: 'forgot', label: 'Forgot PIN' },
]

const DESCRIPTIONS: Record<RulesSection, string> = {
  pin: 'Your transaction PIN authorises transfers and approvals.',
  'expense-rules': 'Ceilings for money leaving an expense account, and when it needs an approver.',
  'approval-rights': 'Who on your team can log, request and approve expenses, and up to how much.',
}

/** Account rules: the transaction PIN, expense rules and approval rights. */
export function AccountRulesModal({ open, section, onSectionChange, onClose }: { open: boolean; section: RulesSection; onSectionChange: (section: RulesSection) => void; onClose: () => void }) {
  const pin = usePinManager(onClose)
  // Expense rules and approval rights are for the owner and admins; everyone else only sees their PIN.
  const { isAdmin } = useExpensePermissions()
  const current: RulesSection = isAdmin ? section : 'pin'
  const footer = (submit: () => void, label: string) => <div className="flex justify-end pt-1"><KitButton onClick={submit} loading={pin.busy}>{label}</KitButton></div>

  return <KitModal open={open} onClose={pin.close} title="Account rules" description={DESCRIPTIONS[current]} icon={<KeyRound size={16}/>} panelClassName="max-w-lg"
    subheader={isAdmin && <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1"><KitFilterPills value={current} options={RULES_SECTIONS} onChange={onSectionChange}/></div>}>
    {current === 'expense-rules' && <ExpenseRulesSection/>}
    {current === 'approval-rights' && <ApprovalRightsSection/>}
    {current === 'pin' && <>
    {pin.hasPin && <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto"><KitFilterPills value={pin.view} options={VIEWS} onChange={pin.setView}/></div>}

    {pin.view === 'set' && <div className="flex flex-col gap-4">
      <KitField label="New PIN" {...pinInput} error={pin.setForm.formState.errors.pin?.message} {...pin.setForm.register('pin')}/>
      <KitField label="Confirm PIN" {...pinInput} error={pin.setForm.formState.errors.confirmPin?.message} {...pin.setForm.register('confirmPin')}/>
      {footer(pin.submitSet, 'Create PIN')}
    </div>}

    {pin.view === 'change' && <div className="flex flex-col gap-4">
      <KitField label="Current PIN" {...pinInput} error={pin.changeForm.formState.errors.oldPin?.message} {...pin.changeForm.register('oldPin')}/>
      <KitField label="New PIN" {...pinInput} error={pin.changeForm.formState.errors.newPin?.message} {...pin.changeForm.register('newPin')}/>
      {footer(pin.submitChange, 'Change PIN')}
    </div>}

    {pin.view === 'forgot' && pin.resetStep === 'request' && <div className="flex flex-col gap-4">
      <p className="text-xs leading-5 text-muted-foreground">We'll email a code to the business owner's address. Enter it on the next step to choose a new PIN.</p>
      {footer(pin.sendCode, 'Email me a code')}
    </div>}
    {pin.view === 'forgot' && pin.resetStep === 'verify' && <div className="flex flex-col gap-4">
      <KitField label="Reset code" inputMode="numeric" placeholder="Code from your email" error={pin.verifyForm.formState.errors.token?.message} {...pin.verifyForm.register('token')}/>
      {footer(pin.submitVerify, 'Verify code')}
    </div>}
    {pin.view === 'forgot' && pin.resetStep === 'reset' && <div className="flex flex-col gap-4">
      <KitField label="New PIN" {...pinInput} error={pin.resetForm.formState.errors.newPin?.message} {...pin.resetForm.register('newPin')}/>
      {footer(pin.submitReset, 'Reset PIN')}
    </div>}
    </>}
  </KitModal>
}
