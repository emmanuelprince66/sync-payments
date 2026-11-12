import { createColumnHelper } from '@tanstack/react-table'
import { FileText, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { KitEmpty, kitTableClass, stretchedButton } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import { cn } from '@/lib/cn'
import type { CustomerDetailModel } from '../hooks/useCustomerDetailPage'
import { InvoiceStatePill } from './InvoiceRisk'

type Row = CustomerDetailModel['invoices']['rows'][number]
const column = createColumnHelper<Row>()
const head = 'py-3.5'

/** The invoices sent to this customer; each opens the invoice. */
export function CustomerInvoices({ model }: { model: CustomerDetailModel['invoices'] }) {
  const columns = useMemo(() => [
    column.display({ id: 'number', header: 'Invoice', cell: ({ row: { original } }) => <><button type="button" onClick={() => model.open(original.id)} className={cn('font-extrabold text-foreground hover:text-secondary', stretchedButton)}>{original.number}</button><p className="mt-0.5 text-[10px] text-muted-foreground">Issued {original.issued}</p></>, meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' } }),
    column.accessor('due', { header: 'Due', cell: info => <span className="font-bold text-foreground/75">{info.getValue()}</span>, meta: { headerClassName: head } }),
    column.accessor('state', { header: 'Status', cell: info => <InvoiceStatePill value={info.getValue()}/>, meta: { headerClassName: head } }),
    column.display({ id: 'amount', header: 'Amount', cell: ({ row: { original } }) => <div className="text-right"><p className="font-extrabold">{original.amount}</p>{original.balance && <p className="mt-0.5 text-[10px] font-extrabold text-[#C72D34]">{original.balance} unpaid</p>}</div>, meta: { headerClassName: `${head} px-5 text-right`, cellClassName: 'px-5' } }),
  ], [model])

  return <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-white">
    <div className="flex items-center justify-between gap-3 border-b border-border p-4">
      <div className="min-w-0"><h2 className="text-sm font-extrabold">Invoices</h2><p className="mt-1 text-[10px] text-muted-foreground">Everything you've invoiced this customer</p></div>
      <KitButton variant="secondary" onClick={model.create} className="shrink-0"><Plus size={14}/> New invoice</KitButton>
    </div>
    <div className={kitTableClass}>
      <DataTable
        columns={columns}
        data={model.rows}
        loading={model.isLoading}
        minWidthClassName="min-w-[560px]"
        getRowId={row => row.id}
        emptyState={<KitEmpty icon={<FileText size={18}/>} title="No invoices yet" note="Invoices you send this customer show up here." className="py-6"/>}
        mobileListClassName="divide-y divide-border/70"
        renderMobileCard={row => <div className="relative flex items-center gap-3 p-4 text-xs">
          <span className="min-w-0 flex-1"><button type="button" onClick={() => model.open(row.id)} className={cn('block font-extrabold', stretchedButton)}>{row.number}</button><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">Due {row.due}</span></span>
          <span className="shrink-0 text-right"><span className="block font-extrabold">{row.amount}</span>{row.balance && <span className="block text-[10px] font-extrabold text-[#C72D34]">{row.balance} unpaid</span>}<span className="mt-1 block"><InvoiceStatePill value={row.state}/></span></span>
        </div>}
      />
    </div>
  </section>
}
