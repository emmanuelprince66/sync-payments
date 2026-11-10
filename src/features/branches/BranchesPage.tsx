import { Plus } from 'lucide-react'
import { KitPage, KitPageHeader } from '@/components/ui/KitPage'
import { KitButton } from '@/components/ui/PaymentKit'
import { CardSkeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { AddBranchModal } from './components/AddBranchModal'
import { BranchCard } from './components/BranchCard'
import { BranchTransactions } from './components/BranchTransactions'
import { BranchTransactionModal } from './components/BranchTransactionModal'
import { useBranchesPage } from './hooks/useBranchesPage'

const cardsGrid = 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'

export default function BranchesPage() {
  const page = useBranchesPage()
  return <KitPage>
    <KitPageHeader
      eyebrow="Operating network"
      title="Branches"
      subtitle="Compare collections, terminals, and settlement activity by location."
      actions={<KitButton onClick={page.addBranch.open}><Plus size={14}/> Add branch</KitButton>}
    />
    {page.branchesLoading
      ? <SkeletonGroup label="Loading branches" className={cardsGrid}>{Array.from({ length: 4 }, (_, index) => <CardSkeleton key={index} className="rounded-xl border border-border bg-white p-4" lines={2}/>)}</SkeletonGroup>
      : page.branches.length === 0
        ? <div className="rounded-xl border border-dashed border-border bg-white px-5 py-10 text-center"><p className="text-sm font-extrabold">No branches yet</p><p className="mt-1 text-xs text-muted-foreground">Complete KYC to open your main account, then add a branch account.</p><KitButton variant="secondary" className="mt-4" onClick={page.goToKyc}>Complete KYC</KitButton></div>
        : <div className={cardsGrid}>{page.branches.map(branch => <BranchCard key={branch.id} branch={branch} active={page.activeId === branch.id} onSelect={() => page.selectBranch(branch.id)}/>)}</div>}
    <BranchTransactions
      branches={page.branches}
      branchNames={page.branchNames}
      dateRange={page.dateRange}
      onDateRange={page.setDateRange}
      activeId={page.activeId}
      onChangeBranch={page.selectBranch}
      rows={page.rows}
      isLoading={page.rowsLoading}
      isError={page.rowsError}
      currentPage={page.currentPage}
      totalPages={page.totalPages}
      onPageChange={page.setCurrentPage}
      onView={page.setSelectedRow}
    />
    <AddBranchModal open={page.addBranch.isOpen} onClose={page.addBranch.close} defaultAccount={page.mainAccountNumber}/>
    {page.selectedRow && <BranchTransactionModal row={page.selectedRow} branchName={page.branchNames[page.selectedRow.bankId]} onClose={page.clearSelectedRow}/>}
  </KitPage>
}
