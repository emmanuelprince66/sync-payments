import { ArrowLeft, ArrowUpRight, ChevronRight, UsersRound } from 'lucide-react'
import { KitEmpty, KitMoneyField } from '@/components/ui/KitExtras'
import { KitField } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { Toggle } from '@/components/ui/Toggle'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { useApprovalRights } from '../../hooks/useApprovalRights'

function RightRow({ title, caption, enabled, onChange }: { title: string; caption: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
    <div className="min-w-0"><p className="text-xs font-extrabold">{title}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{caption}</p></div>
    <Toggle enabled={enabled} onChange={onChange} label={title}/>
  </div>
}

/** Settings › Approval rights: pick a team member, then set what they may do with expenses (sink: Employee Expense Access). */
export function ApprovalRightsSection() {
  const rights = useApprovalRights(true)
  const { symbol } = useBusinessCurrency()
  const { register } = rights.form

  if (!rights.isAdmin) return <p className="rounded-xl bg-[#F8FAF8] p-4 text-xs text-muted-foreground">Only the business owner or an admin can change approval rights.</p>

  if (!rights.member) {
    return <div>
      <p className="text-[10px] leading-4 text-muted-foreground">Choose who can log expenses, request payouts and approve them. The owner can always do all three.</p>
      <div className="mt-4 divide-y divide-border rounded-xl border border-border">
        {rights.teamLoading
          ? <ListSkeleton rows={3} rowClassName="flex items-center gap-4 p-4"/>
          : rights.teamError
            ? <KitEmpty title="Couldn't load your team" action={<KitButton variant="secondary" onClick={rights.retryTeam}>Try again</KitButton>} className="py-6"/>
            : rights.team.length === 0
              ? <KitEmpty icon={<UsersRound size={18}/>} title="No team members yet" note="Staff added to this business on Sync360 show up here." className="py-6"/>
              : rights.team.map(person => <button key={person.id} type="button" onClick={() => rights.open(person)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-[#F8FAF8]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-secondary">{person.name.charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold">{person.name}</span><span className="mt-0.5 block truncate text-[10px] capitalize text-muted-foreground">{person.roleLabel}{person.email ? ` · ${person.email}` : ''}</span></span>
                <ChevronRight size={15} className="shrink-0 text-muted-foreground"/>
              </button>)}
      </div>
    </div>
  }

  return <form onSubmit={rights.submit} noValidate className="flex flex-col gap-5">
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Back to team" onClick={rights.back} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"><ArrowLeft size={15}/></button>
      <div className="min-w-0"><p className="truncate text-sm font-extrabold">{rights.member.name}</p><p className="text-[10px] capitalize text-muted-foreground">{rights.memberRole}</p></div>
    </div>

    {rights.rightsLoading
      ? <div className="flex flex-col gap-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-14"/>)}</div>
      : rights.rightsError
        ? <KitEmpty title="Couldn't load their permissions" note="Try again in a moment." className="py-6"/>
        : <>
          <div>
            <p className="text-xs font-extrabold">How much can they spend?</p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
              <div><KitMoneyField label="Maximum per transaction" symbol={symbol} inputMode="decimal" placeholder="No limit" error={rights.errors.maxTransfer?.message} {...register('maxTransfer')}/><p className="mt-1 text-[10px] text-muted-foreground">The most they can spend or request at once.</p></div>
              <div><KitMoneyField label="Maximum per day" symbol={symbol} inputMode="decimal" placeholder="No limit" error={rights.errors.dailyTransfer?.message} {...register('dailyTransfer')}/><p className="mt-1 text-[10px] text-muted-foreground">Their total for one day.</p></div>
              <div><KitField label="Daily transaction limit" inputMode="numeric" placeholder="No limit" error={rights.errors.dailyCount?.message} {...register('dailyCount')}/><p className="mt-1 text-[10px] text-muted-foreground">How many expense actions in a day.</p></div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-extrabold">What can they do?</p>
            <RightRow title="Log expenses" caption="Record expenses they have already paid for." enabled={rights.flags.canLog} onChange={value => rights.setFlag('canLog', value)}/>
            <RightRow title="Request a transfer" caption="Ask for a payout from the expense account." enabled={rights.flags.canInitiate} onChange={value => rights.setFlag('canInitiate', value)}/>
            <RightRow title="Approve transfers" caption="Approve and release requests from other team members." enabled={rights.flags.canApprove} onChange={value => rights.setFlag('canApprove', value)}/>
            {rights.flags.canApprove && <div className="rounded-xl border border-border p-4">
              <div className="sm:max-w-xs"><KitMoneyField label="Approval limit" symbol={symbol} inputMode="decimal" placeholder="No limit" error={rights.errors.maxApproval?.message} {...register('maxApproval')}/></div>
              <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-4 text-muted-foreground"><ArrowUpRight size={13} className="mt-0.5 shrink-0"/>Requests above this go to the owner instead of being refused. Leave it blank for no limit. Nobody can approve a request they made themselves.</p>
            </div>}
          </div>

          <div className="flex justify-between gap-2">
            <KitButton variant="secondary" onClick={rights.back}>Back</KitButton>
            <KitButton type="submit" loading={rights.saving}>Save permissions</KitButton>
          </div>
        </>}
  </form>
}
