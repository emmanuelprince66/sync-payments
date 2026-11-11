import { createColumnHelper } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import type { Customer } from '@/api/customers'
import { DataTable } from '@/components/ui/DataTable'
import { kitTableClass, stretchedButton } from '@/components/ui/KitExtras'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { CustomerStatus } from './CustomerStatus'
import { UnpaidCell } from './InvoiceRisk'

const column = createColumnHelper<Customer>()
const head = 'py-3.5'

export type CustomerInvoiceCells = { paid: string; paidNote: string; unpaid: string; atRisk: boolean }

type Props = {
  customers: Customer[]
  /** Invoice figures for a row (sample invoices until the endpoint exists). */
  invoiceFigures: (customer: Customer) => CustomerInvoiceCells
  loading: boolean
  emptyState: ReactNode
  onOpen: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerAvatar({ name, className }: { name: string; className?: string }) {
  return <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-extrabold text-secondary', className)}>{initials(name || '?')}</span>
}

function Actions({ customer, onEdit, onDelete }: { customer: Customer; onEdit: Props['onEdit']; onDelete: Props['onDelete'] }) {
  return <div className="relative z-10 flex justify-end gap-1">
    <button type="button" aria-label={`Edit ${customer.name}`} onClick={() => onEdit(customer)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-secondary"><Pencil size={14}/></button>
    <button type="button" aria-label={`Delete ${customer.name}`} onClick={() => onDelete(customer)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-[#FDEAEA] hover:text-[#C72D34]"><Trash2 size={14}/></button>
  </div>
}

/** Customer list: a table on desktop, cards on phones. The whole row opens the profile. */
export function CustomersTable({ customers, invoiceFigures, loading, emptyState, onOpen, onEdit, onDelete }: Props) {
  const columns = useMemo(() => [
    column.display({
      id: 'customer',
      header: 'Customer',
      cell: ({ row: { original } }) => <div className="flex items-center gap-3">
        <CustomerAvatar name={original.name}/>
        <div className="min-w-0">
          <button type="button" onClick={() => onOpen(original)} className={cn('max-w-[220px] truncate text-left font-extrabold text-foreground', stretchedButton)}>{original.name}</button>
          <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-muted-foreground">{original.email || original.code || 'No email'}</p>
        </div>
      </div>,
      meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' },
    }),
    column.accessor('phone', { header: 'Phone', cell: info => <span className="font-bold text-foreground/75">{info.getValue() || '—'}</span>, meta: { headerClassName: head } }),
    column.display({
      id: 'paid',
      header: 'Invoices paid',
      cell: ({ row: { original } }) => { const figures = invoiceFigures(original); return <div><p className="font-extrabold">{figures.paid}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{figures.paidNote}</p></div> },
      meta: { headerClassName: head },
    }),
    column.display({
      id: 'unpaid',
      header: 'Unpaid',
      cell: ({ row: { original } }) => { const figures = invoiceFigures(original); return <UnpaidCell amount={figures.unpaid} atRisk={figures.atRisk}/> },
      meta: { headerClassName: head },
    }),
    column.accessor('status', { header: 'Status', cell: info => <CustomerStatus value={info.getValue()}/>, meta: { headerClassName: head } }),
    column.display({ id: 'actions', header: '', cell: ({ row: { original } }) => <Actions customer={original} onEdit={onEdit} onDelete={onDelete}/>, meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' } }),
  ], [invoiceFigures, onOpen, onEdit, onDelete])

  return <div className={kitTableClass}>
    <DataTable
      columns={columns}
      data={customers}
      loading={loading}
      minWidthClassName="min-w-[860px]"
      getRowId={customer => customer.id}
      emptyState={emptyState}
      renderMobileCard={customer => <div className="relative flex items-start gap-3 p-4 text-xs">
        <CustomerAvatar name={customer.name}/>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => onOpen(customer)} className={cn('block max-w-full truncate text-left font-extrabold', stretchedButton)}>{customer.name}</button>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p>
          {(() => { const figures = invoiceFigures(customer); return <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2"><span><span className="font-extrabold">{figures.paid}</span> <span className="text-[10px] text-muted-foreground">paid</span></span>{figures.atRisk && <UnpaidCell amount={figures.unpaid} atRisk/>}<CustomerStatus value={customer.status}/></div> })()}
        </div>
        <Actions customer={customer} onEdit={onEdit} onDelete={onDelete}/>
      </div>}
    />
  </div>
}
