import { CalendarClock, FileCheck2, FileText, FileWarning, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { KitEmpty, StatTile, StatTileSkeleton } from '@/components/ui/KitExtras'
import { KitPage } from '@/components/ui/KitPage'
import { BackLink } from '@/components/ui/misc'
import { KitButton } from '@/components/ui/PaymentKit'
import { CardSkeleton, Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { CustomerFormModal } from './components/CustomerFormModal'
import { CustomerInvoices } from './components/CustomerInvoices'
import { AtRiskChip } from './components/InvoiceRisk'
import { CustomerStatus } from './components/CustomerStatus'
import { CustomerTransactions } from './components/CustomerTransactions'
import { CustomerAvatar } from './components/CustomersTable'
import { DeleteCustomerModal } from './components/DeleteCustomerModal'
import { useCustomerDetailPage } from './hooks/useCustomerDetailPage'

const statIcons = [FileCheck2, FileWarning, CalendarClock, FileText]
const statTones = ['green', 'amber', 'amber', 'blue'] as const
/** Unpaid and overdue figures read in red while anything is owed. */
const dangerValue = '[&_p.mt-3]:text-[#C72D34]'
const statsGrid = 'grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-4'

function DetailSkeleton() {
  return <SkeletonGroup label="Loading customer" className="flex flex-col gap-6">
    <div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-full"/><div className="flex-1 space-y-2"><Skeleton className="h-6 w-48 max-w-full"/><Skeleton className="h-3 w-32"/></div></div>
    <div className={statsGrid}>{statIcons.map((_, index) => <StatTileSkeleton key={index}/>)}</div>
    <CardSkeleton className="rounded-xl border border-border bg-white p-5" lines={5}/>
  </SkeletonGroup>
}

/** A customer's profile: contact details, invoice figures and invoices, and their transaction history. */
export default function CustomerDetailPage() {
  const page = useCustomerDetailPage()
  const customer = page.customer

  return <KitPage>
    <div className="-mb-5"><BackLink label="Back to customers" onClick={page.goBack}/></div>

    {page.isLoading ? <DetailSkeleton/> : page.isError || !customer
      ? <div className="rounded-xl border border-border bg-white"><KitEmpty title="We couldn’t load this customer" note="They may have been deleted, or the connection dropped." action={<div className="flex gap-2"><KitButton variant="secondary" onClick={page.goBack}>Back to customers</KitButton><KitButton onClick={page.retry}>Try again</KitButton></div>}/></div>
      : <>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <CustomerAvatar name={customer.name} className="h-14 w-14 text-sm"/>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-extrabold tracking-[-0.035em]">{customer.name}</h1><CustomerStatus value={customer.status}/>{page.atRisk && <AtRiskChip/>}</div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{[customer.code, page.tier && `${page.tier} tier`, page.segment].filter(Boolean).join(' · ') || customer.phone}</p>
            </div>
          </div>
          {(page.can.edit || page.can.delete) && <div className="grid grid-cols-2 gap-2 sm:flex">
            {page.can.delete && <KitButton variant="secondary" onClick={page.confirmDelete.open}><Trash2 size={14}/> Delete</KitButton>}
            {page.can.edit && <KitButton onClick={page.edit.open}><Pencil size={14}/> Edit</KitButton>}
          </div>}
        </div>

        {page.statsLoading
          ? <div className={statsGrid}>{statIcons.map((_, index) => <StatTileSkeleton key={index}/>)}</div>
          : <div className={statsGrid}>{page.stats.map((stat, index) => <div key={stat.label} className={stat.danger ? dangerValue : undefined}><StatTile label={stat.label} value={stat.value} note={stat.note} icon={statIcons[index]} tone={statTones[index]}/></div>)}</div>}

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="text-sm font-extrabold">Customer details</h2>
            {page.insight && <p className="mt-3 flex gap-2 rounded-xl bg-accent p-3 text-[11px] leading-4 text-foreground/80"><Sparkles size={14} className="mt-0.5 shrink-0 text-secondary"/>{page.insight}</p>}
            <dl className="mt-3 divide-y divide-border">
              {page.details.map(([label, value]) => <div key={label} className="py-3"><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-1 text-xs font-extrabold [overflow-wrap:anywhere]">{value}</dd></div>)}
            </dl>
          </section>
          <div className="flex min-w-0 flex-col gap-6">
            <CustomerInvoices model={page.invoices}/>
            <CustomerTransactions model={page.transactions}/>
          </div>
        </div>

        <CustomerFormModal open={page.edit.isOpen} customer={customer} onClose={page.edit.close}/>
        <DeleteCustomerModal customer={page.confirmDelete.isOpen ? customer : null} deleting={page.isDeleting} onCancel={page.confirmDelete.close} onConfirm={page.deleteCustomer}/>
      </>}
  </KitPage>
}
