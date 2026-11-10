import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useBranches, useBranchTransactions, type WalletRow } from '@/api/branches'
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter'
import { useDisclosure } from '@/hooks/useDisclosure'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

export function useBranchesPage() {
  const navigate = useNavigate()
  const { branches, isLoading: branchesLoading } = useBranches()
  const addBranch = useDisclosure()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<WalletRow | null>(null)
  const dates = useDateRangeFilter({ onChange: () => setCurrentPage(1) })
  const transactions = useBranchTransactions(activeId, currentPage, PAGE_SIZE, dates.startDate, dates.endDate)

  const branchNames = useMemo(() => Object.fromEntries(branches.map(branch => [branch.id, branch.name])), [branches])

  return {
    branches,
    branchesLoading,
    branchNames,
    mainAccountNumber: branches.find(branch => branch.isMain)?.accountNumber ?? '',
    addBranch,
    goToKyc: () => navigate(paths.kyc),
    dateRange: dates.range,
    setDateRange: dates.setRange,
    activeId,
    selectBranch: (id: string | null) => { setActiveId(id); setCurrentPage(1) },
    rows: transactions.rows,
    rowsLoading: transactions.isLoading,
    rowsError: transactions.isError,
    currentPage,
    totalPages: transactions.pages,
    setCurrentPage,
    selectedRow,
    setSelectedRow,
    clearSelectedRow: () => setSelectedRow(null),
  }
}
