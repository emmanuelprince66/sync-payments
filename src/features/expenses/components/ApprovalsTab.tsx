import { createColumnHelper } from '@tanstack/react-table'
import { ChevronRight, ClipboardCheck, Lock, ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { KitEmpty, KitFilterPills, KitSearch, kitTableClass } from '@/components/ui/KitExtras'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/cn'
import { transferStatus, type ApprovalItem } from '../approval-items'
import { APPROVAL_FILTERS, useApprovalsQueue } from '../hooks/useApprovalsQueue'
import { ApprovalDecisionModal } from './ApprovalDecisionModal'

const column = createColumnHelper<ApprovalItem>()

export function TransferStatusChip({ status }: { status: string }) {
  const meta = transferStatus(status)
  return <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-extrabold', meta.className)}>{meta.label}</span>
}

const requestedOn = (item: ApprovalItem) => item.details.find(([label]) => label === 'Requested on')?.[1] ?? ''

/** Expenses › Approvals: sink's transfer approval queue (filters, search, table, details → PIN / reason). */
export function ApprovalsTab() {
  const page = useApprovalsQueue()
  const { money, decision } = page

  const columns = useMemo(() => [
    column.display({ id: 'requested', header: 'Requested', meta: { headerClassName: 'px-5', cellClassName: 'px-5' }, cell: ({ row: { original } }) => <span className="text-muted-foreground">{requestedOn(original)}</span> }),
    column.display({ id: 'beneficiary', header: 'Beneficiary', cell: ({ row: { original } }) => <button type="button" onClick={() => decision.open(original)} className="max-w-[220px] text-left"><p className="truncate font-extrabold hover:text-secondary">{original.title}</p><p className="mt-1 truncate text-[9px] text-muted-foreground">{original.reference} · {original.category}</p></button> }),
    column.display({ id: 'requester', header: 'Requested by', cell: ({ row: { original } }) => <span className="font-bold text-foreground/70">{original.requester}</span> }),
    column.display({ id: 'amount', header: 'Amount', meta: { headerClassName: 'text-right', cellClassName: 'text-right' }, cell: ({ row: { original } }) => <span className="font-extrabold">{money(original.amount)}</span> }),
    column.display({ id: 'status', header: 'Status', cell: ({ row: { original } }) => <TransferStatusChip status={original.status}/> }),
    column.display({ id: 'action', header: 'Action', meta: { headerClassName: 'px-5 text-right', cellClassName: 'px-5 text-right' }, cell: ({ row: { original } }) => <button type="button" onClick={() => decision.open(original)} className={cn('rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold', original.canDecide ? 'bg-primary text-white hover:bg-primary/90' : 'border border-border text-secondary hover:bg-accent')}>{original.canDecide ? 'Review' : 'View'}</button> }),
  ], [money, decision])

  if (!page.allowed) {
    return <section className="rounded-2xl border border-border bg-white">
      <KitEmpty icon={<Lock size={18}/>} title="Nothing to see here" note="Your account doesn't handle expense payouts. The business owner or an admin can grant that in Expenses › Settings › Approval rights."/>
    </section>
  }

  return <div className="flex flex-col gap-4">
    <div>
      <h2 className="text-sm font-extrabold">Transfer approvals</h2>
      <p className="mt-1 text-[10px] text-muted-foreground">{page.subtitle}</p>
    </div>

    {page.capNote && <p className="flex items-center gap-2 rounded-xl bg-[#F8FAF8] px-3 py-2.5 text-[10px] font-bold text-muted-foreground"><ShieldCheck size={14} className="shrink-0 text-secondary"/>{page.capNote}</p>}

    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 xl:mx-0 xl:px-0"><KitFilterPills value={page.filter} options={APPROVAL_FILTERS} onChange={page.setFilter}/></div>
        <div className="flex w-full xl:max-w-xs"><KitSearch value={page.searchInput} onChange={page.setSearch} placeholder="Reference, beneficiary or narration"/></div>
      </div>
      <div className={cn('transition-opacity', page.refreshing && 'opacity-60')}>
        <DataTable
          columns={columns}
          data={page.items}
          loading={page.loading}
          minWidthClassName="min-w-[820px]"
          className={cn(kitTableClass, '[&_tbody_tr]:static')}
          getRowId={row => row.id}
          emptyState={<KitEmpty icon={<ClipboardCheck size={18}/>} title={page.emptyNote} note="Payout requests from expense accounts show up here." className="py-4"/>}
          mobileListClassName="divide-y divide-border/70"
          renderMobileCard={item => <button type="button" onClick={() => decision.open(item)} className="flex w-full items-center gap-3 p-4 text-left text-xs">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-extrabold">{item.title}</span>
              <span className="mt-1 block truncate text-[10px] text-muted-foreground">{item.requester} · {requestedOn(item)}</span>
              <span className="mt-2 block"><TransferStatusChip status={item.status}/></span>
            </span>
            <span className="shrink-0 text-right font-extrabold">{money(item.amount)}</span>
            <ChevronRight size={15} className="shrink-0 text-muted-foreground"/>
          </button>}
        />
      </div>
      {page.total > 0 && <Pagination currentPage={page.pagination.page} totalPages={page.pagination.pages} onPageChange={page.pagination.setPage} pageSize={page.pagination.pageSize} onPageSizeChange={page.pagination.setPageSize} className="border-border"/>}
    </section>

    <ApprovalDecisionModal decision={decision}/>
  </div>
}
