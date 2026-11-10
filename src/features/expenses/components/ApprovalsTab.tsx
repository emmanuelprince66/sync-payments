import { ChevronDown, ClipboardCheck, CreditCard, FileText, Lock, Send, UserCheck } from 'lucide-react'
import { KitEmpty, KitFilterPills } from '@/components/ui/KitExtras'
import { SampleDataBadge } from '@/components/ui/misc'
import { Pagination } from '@/components/ui/Pagination'
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import type { ApprovalItem } from '../approval-items'
import { APPROVAL_FILTERS, useApprovalsQueue } from '../hooks/useApprovalsQueue'
import { ApprovalDecisionModal } from './ApprovalDecisionModal'

const STATUS_CLASS: Record<ApprovalItem['status'], string> = {
  'Awaiting approval': 'bg-[#FFF6E4] text-[#A76700]',
  Approved: 'bg-accent text-secondary',
  Paid: 'bg-[#E7F1FC] text-[#1C6FA8]',
  Processing: 'bg-[#E7F1FC] text-[#1C6FA8]',
  Rejected: 'bg-[#FDEAEA] text-[#C72D34]',
  Failed: 'bg-[#FDEAEA] text-[#C72D34]',
}

const SOURCE_ICON = { expense: CreditCard, transfer: Send, sample: FileText }

function ApprovalRow({ item, onOpen }: { item: ApprovalItem; onOpen: () => void }) {
  const money = useFormatMoney()
  const Icon = SOURCE_ICON[item.kind]
  return <button type="button" onClick={onOpen} className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-[#F8FAF8] sm:flex-row sm:items-center">
    <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', item.kind === 'expense' ? 'bg-accent text-secondary' : 'bg-[#E7F1FC] text-[#1C6FA8]')}><Icon size={17}/></span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 truncate text-xs font-extrabold">{item.title}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-extrabold text-muted-foreground">{item.source}</span>
        {item.kind === 'sample' && <SampleDataBadge/>}
      </span>
      <span className="mt-1 block text-[10px] text-muted-foreground">{item.requester} · {item.category} · {item.submitted}</span>
    </span>
    <span className="block shrink-0 sm:text-right">
      <span className="block text-sm font-extrabold">{money(item.amount)}</span>
      <span className={cn('mt-1 inline-block rounded-full px-2.5 py-1 text-[9px] font-extrabold', STATUS_CLASS[item.status])}>{item.status}</span>
    </span>
    <ChevronDown size={15} className="hidden -rotate-90 text-muted-foreground sm:block"/>
  </button>
}

const STEPS = [
  ['Requester', 'Creates request', 'Team members submit expenses and transfers with the business purpose.'],
  ['Approver', 'Reviews and approves', 'A designated manager checks policy, budget, and supporting documents.'],
  ['Sync360', 'Moves the money', 'Only approved transfers are released from the account, with a full audit trail.'],
]

/** The approvals queue: real expense and transfer approvals plus the session's sample items. */
export function ApprovalsTab() {
  const page = useApprovalsQueue()

  return <div className="flex flex-col gap-6">
    {!page.allowed
      ? <section className="rounded-2xl border border-border bg-white"><KitEmpty icon={<Lock size={18}/>} title="You don't have access to approvals" note="Ask the business owner to give you expense or transfer permissions."/></section>
      : <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white"><UserCheck size={18}/></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-extrabold">{page.queueTitle}</h2>
                {page.loading ? <Skeleton className="h-5 w-24 rounded-full"/> : <span className="rounded-full bg-[#FFF6E4] px-2.5 py-1 text-[9px] font-extrabold text-[#A76700]">{page.waiting} WAITING FOR YOU</span>}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{page.queueNote}</p>
            </div>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0"><KitFilterPills value={page.filter} options={APPROVAL_FILTERS} onChange={page.setFilter}/></div>
        </div>
        {page.loading
          ? <ListSkeleton rows={4} rowClassName="flex items-center gap-4 border-b border-border p-5 last:border-0"/>
          : page.items.length === 0
            ? <KitEmpty icon={<ClipboardCheck size={18}/>} title="Nothing in this queue" note="Requests that need a decision will show up here."/>
            : <div className="divide-y divide-border">{page.items.map(item => <ApprovalRow key={`${item.kind}-${item.id}`} item={item} onOpen={() => page.decision.open(item)}/>)}</div>}
        {page.pagination.pages > 1 && <Pagination currentPage={page.pagination.page} totalPages={page.pagination.pages} onPageChange={page.pagination.setPage} className="border-border"/>}
      </section>}

    <section className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
      {STEPS.map(([eyebrow, title, copy], index) => <div key={title} className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-white">{index + 1}</span><p className="text-[9px] font-extrabold uppercase tracking-wider text-secondary">{eyebrow}</p></div>
        <p className="mt-4 text-sm font-extrabold">{title}</p>
        <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{copy}</p>
      </div>)}
    </section>

    <ApprovalDecisionModal decision={page.decision}/>
  </div>
}
