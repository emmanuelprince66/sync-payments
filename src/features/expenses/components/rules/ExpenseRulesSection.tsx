import { ShieldCheck } from 'lucide-react'
import { KitMoneyField } from '@/components/ui/KitExtras'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { Toggle } from '@/components/ui/Toggle'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { useExpenseRules } from '../../hooks/useExpenseRules'

/** Settings › Expense rules: business-wide ceilings and the approval switch (sink: Expense Controls). */
export function ExpenseRulesSection() {
  const rules = useExpenseRules()
  const { symbol } = useBusinessCurrency()
  const { register } = rules.form

  if (!rules.isAdmin) return <p className="rounded-xl bg-[#F8FAF8] p-4 text-xs text-muted-foreground">Only the business owner or an admin can change expense rules.</p>
  if (rules.loading) return <div className="flex flex-col gap-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-11"/>)}</div>

  return <form onSubmit={rules.submit} noValidate className="flex flex-col gap-5">
    <p className="flex items-start gap-2 rounded-xl border border-secondary/25 bg-accent p-3 text-[10px] text-muted-foreground"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-secondary"/><span>Leave a limit at <b className="text-foreground">0</b> to not enforce it. Zero means unlimited here, not blocked.</span></p>

    <div>
      <p className="text-xs font-extrabold">Spending limits</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <div><KitMoneyField label="Max per transaction" symbol={symbol} inputMode="decimal" placeholder="0" error={rules.errors.maxPerTransaction?.message} {...register('maxPerTransaction')}/><p className="mt-1 text-[10px] text-muted-foreground">The largest single payout anyone can send.</p></div>
        <div><KitMoneyField label="Daily transfer limit" symbol={symbol} inputMode="decimal" placeholder="0" error={rules.errors.dailyTransferLimit?.message} {...register('dailyTransferLimit')}/><p className="mt-1 text-[10px] text-muted-foreground">Total that can leave in one day, across everyone.</p></div>
        <div><KitField label="Transfers per day" inputMode="numeric" placeholder="0" error={rules.errors.dailyTransactionLimit?.message} {...register('dailyTransactionLimit')}/><p className="mt-1 text-[10px] text-muted-foreground">How many payouts can be made in one day.</p></div>
      </div>
    </div>

    <div>
      <p className="text-xs font-extrabold">Approvals</p>
      <div className="mt-3 flex items-start justify-between gap-4 rounded-xl border border-border p-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold">Approval required for staff payouts</p>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">On, a staff transfer waits for an approver even when it is within the limits. Off, it goes out as soon as the sender enters their PIN.</p>
          <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">This doesn't hold up the owner: an owner's PIN releases a payout straight away, within the limits above.</p>
        </div>
        <Toggle enabled={rules.requireApproval} onChange={rules.setRequireApproval} label="Approval required for staff payouts"/>
      </div>
    </div>

    <div className="flex justify-end"><KitButton type="submit" loading={rules.saving}>Save controls</KitButton></div>
  </form>
}
