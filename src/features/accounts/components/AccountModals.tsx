import { Banknote, Check, CheckCircle2, Copy, Landmark, Plus } from 'lucide-react'
import { KitModal } from '@/components/ui/KitExtras'
import { KitField, KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { groupAccount } from '@/features/transactions/format'
import { usePayoutBankForm, useSubAccountForm } from '../hooks/useAccountForms'
import type { AccountsModel } from '../hooks/useAccountsPage'

export function SubAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const form = useSubAccountForm(onClose)
  return <KitModal
    open={open}
    onClose={form.close}
    title="Add account"
    description="Open a sub-account for a branch, a department, or company spend."
    icon={<Plus size={16}/>}
    panelClassName="max-w-md"
    footer={<><KitButton variant="secondary" onClick={form.close}>Cancel</KitButton><KitButton onClick={form.onSubmit} loading={form.submitting}>Create account</KitButton></>}
  >
    <div className="flex flex-col gap-4">
      <KitSelect label="Fund it from" error={form.errors.previousAccount?.message} {...form.register('previousAccount')}>
        <option value="">Select an account</option>
        {form.fundingOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </KitSelect>
      <KitField label="Account or branch name" placeholder="e.g. Lekki branch" error={form.errors.branch?.message} {...form.register('branch')}/>
      <label className="flex items-center gap-3 rounded-xl bg-[#F8FAF8] p-4 text-xs font-bold"><input type="checkbox" className="h-4 w-4 accent-[#529661]" {...form.register('isExpenses')}/> Use this as an expense account</label>
    </div>
  </KitModal>
}

export function PayoutBankModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const form = usePayoutBankForm(onClose)
  return <KitModal
    open={open}
    onClose={form.close}
    title="Add payout account"
    description="Where withdrawals from this business can be sent."
    icon={<Banknote size={16}/>}
    panelClassName="max-w-md"
    footer={<><KitButton variant="secondary" onClick={form.close}>Cancel</KitButton><KitButton onClick={form.onSubmit} loading={form.submitting} disabled={!form.accountName}>Save account</KitButton></>}
  >
    <div className="flex flex-col gap-4">
      <KitSelect label="Bank" error={form.errors.bankCode?.message} {...form.register('bankCode')}>
        <option value="">{form.loadingBanks ? 'Loading banks…' : 'Select a bank'}</option>
        {form.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </KitSelect>
      <KitField label="Account number" inputMode="numeric" maxLength={10} placeholder="10-digit account number" error={form.errors.accountNumber?.message} {...form.register('accountNumber')}/>
      {form.verifying && <Skeleton className="h-11 w-full rounded-xl"/>}
      {!form.verifying && form.accountName && <div className="flex items-center gap-2 rounded-xl border border-secondary/25 bg-accent px-3 py-3 text-xs font-bold text-secondary"><CheckCircle2 size={14} className="shrink-0"/><span className="truncate">{form.accountName}</span></div>}
      {form.verifyFailed && <p role="alert" className="rounded-lg bg-[#FDEAEA] px-3 py-2 text-[10px] font-bold text-[#C72D34]">We couldn't verify this account. Check the bank and number.</p>}
    </div>
  </KitModal>
}

/** sink: "Fund Account": the selected account's transfer details. */
export function FundModal({ page }: { page: AccountsModel }) {
  const account = page.current
  return <KitModal
    open={page.fund.isOpen}
    onClose={page.fund.close}
    title="Fund account"
    description="Make a bank transfer to this account. The balance updates as soon as it arrives."
    icon={<Landmark size={16}/>}
    panelClassName="max-w-md"
    footer={<><KitButton variant="secondary" onClick={page.copyNumber} disabled={!account?.accountNumber}>{page.copied ? <Check size={14}/> : <Copy size={14}/>}{page.copied ? 'Copied' : 'Copy number'}</KitButton><KitButton onClick={page.fund.close}>Done</KitButton></>}
  >
    <div className="rounded-2xl bg-primary p-5 text-white">
      <p className="truncate text-sm font-extrabold">{account?.name}</p>
      <p className="mt-4 text-2xl font-extrabold tracking-[.06em] [overflow-wrap:anywhere]">{account?.accountNumber ? groupAccount(account.accountNumber) : 'Nil'}</p>
      <p className="mt-1 text-xs text-white/70">{account?.bank}</p>
    </div>
  </KitModal>
}
