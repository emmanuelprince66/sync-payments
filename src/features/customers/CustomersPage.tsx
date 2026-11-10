import { HandCoins, Plus, UsersRound, Wallet, WalletCards } from 'lucide-react'
import { KitEmpty, KitSearch, StatTile, StatTileSkeleton } from '@/components/ui/KitExtras'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { Pagination } from '@/components/ui/Pagination'
import { KitButton } from '@/components/ui/PaymentKit'
import { Select } from '@/components/ui/Select'
import { SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { CustomerFormModal } from './components/CustomerFormModal'
import { CustomersTable } from './components/CustomersTable'
import { DeleteCustomerModal } from './components/DeleteCustomerModal'
import { useCustomersPage } from './hooks/useCustomersPage'

const statIcons = [UsersRound, HandCoins, Wallet, WalletCards]
const statTones = ['green', 'blue', 'green', 'amber'] as const
const statsGrid = 'grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-4'

export default function CustomersPage() {
  const page = useCustomersPage()

  const emptyState = page.isError
    ? <KitEmpty title="We couldn’t load your customers" note="Check your connection and try again." action={<KitButton variant="secondary" onClick={page.retry}>Try again</KitButton>}/>
    : page.isFiltered
      ? <KitEmpty icon={<UsersRound size={18}/>} title="No customers match" note="Try another name, phone number or status."/>
      : <KitEmpty icon={<UsersRound size={18}/>} title="No customers yet" note="Add the people you sell to, so you can see their history and send them invoices." action={<KitButton onClick={page.openAdd}><Plus size={14}/> Add customer</KitButton>}/>

  return <KitPage>
    <KitPageHeader
      eyebrow="Relationships"
      title="Customers"
      subtitle="Everyone you sell to, with their spend, balances and history."
      actions={<KitButton onClick={page.openAdd} className="self-start md:self-auto"><Plus size={14}/> Add customer</KitButton>}
    />

    {page.stats
      ? <div className={statsGrid}>{page.stats.map((stat, index) => <StatTile key={stat.label} label={stat.label} value={stat.value} note={stat.note} icon={statIcons[index]} tone={statTones[index]}/>)}</div>
      : page.isLoading && <SkeletonGroup label="Loading customer stats" className={statsGrid}>{statIcons.map((_, index) => <StatTileSkeleton key={index}/>)}</SkeletonGroup>}

    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <KitSearch value={page.searchInput} onChange={page.setSearch} placeholder="Search by name, phone or email"/>
        <Select aria-label="Filter by status" options={page.statusOptions} value={page.status || 'all'} onValueChange={page.setStatus} className="w-full sm:w-[180px]" boxClassName="h-10 border-border px-3 text-xs font-bold text-foreground"/>
      </div>
      <div className={cn('transition-opacity', page.isFetching && 'opacity-60')}>
        <CustomersTable customers={page.customers} loading={page.isLoading} emptyState={emptyState} onOpen={page.openCustomer} onEdit={page.openEdit} onDelete={page.askDelete}/>
      </div>
      {!page.isLoading && page.customers.length > 0 && <Pagination currentPage={page.page} totalPages={page.totalPages} onPageChange={page.setPage} pageSize={page.pageSize} onPageSizeChange={page.setPageSize}/>}
    </section>

    <CustomerFormModal open={page.dialog !== null} customer={page.dialog?.mode === 'edit' ? page.dialog.customer : null} onClose={page.closeDialog}/>
    <DeleteCustomerModal customer={page.toDelete} deleting={page.isDeleting} onCancel={page.cancelDelete} onConfirm={page.confirmDelete}/>
  </KitPage>
}
