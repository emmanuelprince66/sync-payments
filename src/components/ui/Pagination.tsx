import { cn } from '@/lib/cn'
import { Icon } from './Icon'
import { Select } from './Select'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Rows per page selector — shown only when both are given (as in sink-inventory's Pagination). */
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: readonly number[]
  className?: string
}

function PageButton({ label, icon, flip, onClick, disabled, className }: { label: string; icon: 'arrow' | 'double'; flip?: boolean; onClick: () => void; disabled: boolean; className?: string }) {
  return <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={cn('flex h-8 w-8 items-center justify-center rounded-lg border border-[#DFE7E2] bg-white text-[#34483F] transition hover:border-[#529661] disabled:cursor-not-allowed disabled:opacity-40', className)}>
    <span className={cn('flex', flip && 'rotate-180')}>{icon === 'double' ? <span className="flex -space-x-2"><Icon name="arrow" size={14}/><Icon name="arrow" size={14}/></span> : <Icon name="arrow" size={15}/>}</span>
  </button>
}

/** Page X of Y, rows per page, and first/previous/next/last — sink-inventory's Pagination in Sync360 Payments style. */
export function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, pageSizeOptions = [10, 20, 30, 50, 100], className }: PaginationProps) {
  const pages = Math.max(totalPages, 1)
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < pages

  return <div className={cn('flex flex-col items-center justify-between gap-3 border-t border-[#EBF0ED] px-4 py-3 sm:flex-row sm:px-5', className)}>
    <div className="order-2 text-[11px] font-semibold text-[#829189] sm:order-1">Page {Math.min(currentPage, pages)} of {pages}</div>
    <div className="order-1 flex w-full items-center justify-between gap-4 sm:order-2 sm:w-auto sm:justify-end">
      {pageSize !== undefined && onPageSizeChange && <div className="flex items-center gap-2">
        <span className="hidden whitespace-nowrap text-[11px] font-bold text-[#53665D] sm:inline">Rows per page</span>
        <Select aria-label="Rows per page" options={pageSizeOptions.map(size => ({ value: String(size), label: String(size) }))} value={String(pageSize)} onValueChange={size => onPageSizeChange(Number(size))} className="w-[72px]" boxClassName="h-8 rounded-lg border-[#DFE7E2] px-2.5 text-xs font-bold text-[#34483F]"/>
      </div>}
      <div className="flex items-center gap-2">
        <PageButton label="Go to first page" icon="double" flip onClick={() => onPageChange(1)} disabled={!canGoPrevious} className="hidden lg:flex"/>
        <PageButton label="Go to previous page" icon="arrow" flip onClick={() => onPageChange(currentPage - 1)} disabled={!canGoPrevious}/>
        <PageButton label="Go to next page" icon="arrow" onClick={() => onPageChange(currentPage + 1)} disabled={!canGoNext}/>
        <PageButton label="Go to last page" icon="double" onClick={() => onPageChange(pages)} disabled={!canGoNext} className="hidden lg:flex"/>
      </div>
    </div>
  </div>
}
