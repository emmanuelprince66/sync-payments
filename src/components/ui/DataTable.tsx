import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type RowData } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Extra classes for this column's <th>, e.g. "px-5" for the first column. */
    headerClassName?: string
    /** Extra classes for this column's <td>. */
    cellClassName?: string
  }
}

const variants = {
  /** Shipments table: 10px uppercase head, px-4 py-4 cells. */
  default: {
    head: 'border-b border-[#EAF0EC] text-left text-[10px] font-extrabold uppercase tracking-[.08em] text-[#899891]',
    th: 'px-4 py-3.5',
    row: 'border-b border-[#EFF3F0] last:border-0 hover:bg-[#FAFCFA]',
    td: 'whitespace-nowrap px-4 py-4',
  },
  /** Sales history table: 9px head, no horizontal padding. */
  compact: {
    head: 'border-b border-[#E7EDE9] text-left text-[9px] font-extrabold uppercase tracking-[.08em] text-[#8B9992]',
    th: 'py-3',
    row: 'border-b border-[#EDF1EF] last:border-0',
    td: 'whitespace-nowrap py-4',
  },
} as const

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[] // eslint-disable-line @typescript-eslint/no-explicit-any
  data: TData[]
  variant?: keyof typeof variants
  /** Table min width so it scrolls horizontally on small screens, e.g. "min-w-[720px]". */
  minWidthClassName?: string
  loading?: boolean
  emptyState?: ReactNode
  getRowId?: (row: TData) => string
  className?: string
  /** When set, phones (< md) get this card list instead of a sideways-scrolling table. */
  renderMobileCard?: (row: TData) => ReactNode
  /** Classes for the mobile card list wrapper. */
  mobileListClassName?: string
}

/**
 * Reusable table (TanStack Table, same approach as sink-inventory's CustomTable)
 * styled to the Sync360 Payments design. Define columns with `createColumnHelper<T>()`
 * and use `meta.headerClassName` / `meta.cellClassName` for per-column padding.
 */
export function DataTable<TData>({ columns, data, variant = 'default', minWidthClassName = 'min-w-[720px]', loading = false, emptyState = 'Nothing to show yet', getRowId, className, renderMobileCard, mobileListClassName = 'divide-y divide-[#EFF3F0]' }: DataTableProps<TData>) {
  // TanStack Table returns non-memoizable functions; React Compiler lint can't analyse it.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getRowId })
  const styles = variants[variant]
  const columnCount = table.getVisibleLeafColumns().length

  const rows = table.getRowModel().rows

  return <>
  {renderMobileCard && <div className="md:hidden">
    {loading
      ? <div className={mobileListClassName}>{Array.from({ length: 3 }, (_, index) => <div key={index} className="space-y-2 p-4"><div className="h-3 w-24 animate-pulse rounded bg-[#EEF3F0]"/><div className="h-3 w-40 animate-pulse rounded bg-[#EEF3F0]"/></div>)}</div>
      : rows.length === 0
        ? <div className="px-5 py-12 text-center text-xs font-semibold text-[#899891]">{emptyState}</div>
        : <ul className={mobileListClassName}>{rows.map(row => <li key={row.id}>{renderMobileCard(row.original)}</li>)}</ul>}
  </div>}
  <div className={cn('overflow-x-auto', renderMobileCard && 'hidden md:block', className)}>
    <table className={cn('w-full', minWidthClassName)}>
      <thead>{table.getHeaderGroups().map(group => <tr key={group.id} className={styles.head}>
        {group.headers.map(header => <th key={header.id} className={cn(styles.th, header.column.columnDef.meta?.headerClassName)}>
          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
        </th>)}
      </tr>)}</thead>
      <tbody>
        {loading
          ? Array.from({ length: 4 }, (_, index) => <tr key={index} className={styles.row}>{Array.from({ length: columnCount }, (_, cell) => <td key={cell} className={styles.td}><div className="h-3 w-full max-w-[120px] animate-pulse rounded bg-[#EEF3F0]"/></td>)}</tr>)
          : table.getRowModel().rows.length === 0
            ? <tr><td colSpan={columnCount} className="px-5 py-12 text-center text-xs font-semibold text-[#899891]">{emptyState}</td></tr>
            : table.getRowModel().rows.map(row => <tr key={row.id} className={styles.row}>
              {row.getVisibleCells().map(cell => <td key={cell.id} className={cn(styles.td, cell.column.columnDef.meta?.cellClassName)}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
            </tr>)}
      </tbody>
    </table>
  </div>
  </>
}
