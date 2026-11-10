import { createColumnHelper } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import type { Employee } from '@/api/payroll'
import { DataTable } from '@/components/ui/DataTable'
import { KitButton } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'

function EmployeeStatus({ status }: { status: Employee['status'] }) {
  return <span className={cn('rounded px-2 py-1 text-[8px] font-extrabold', status === 'Ready' ? 'bg-accent text-secondary' : 'bg-[#FFF6E4] text-[#A76700]')}>{status}</span>
}

const head = 'bg-muted py-3 text-[8px] uppercase tracking-wider text-muted-foreground'
const column = createColumnHelper<Employee>()

export function PayrollEmployees({ employees, onAdd }: { employees: Employee[]; onAdd: () => void }) {
  const money = useFormatMoney()
  const columns = useMemo(() => [
    column.display({ id: 'employee', header: 'Employee', cell: ({ row }) => <><b>{row.original.name}</b><p className="mt-1 text-[8px] text-muted-foreground">{row.original.role}</p></>, meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' } }),
    column.accessor('type', { header: 'Employment', cell: info => `${info.getValue()} · Full-time`, meta: { headerClassName: head } }),
    column.accessor('account', { header: 'Bank', meta: { headerClassName: head } }),
    column.accessor('amount', { header: 'Gross pay', cell: info => money(info.getValue()), meta: { headerClassName: head, cellClassName: 'font-extrabold' } }),
    column.display({ id: 'tax', header: 'Tax setup', cell: () => 'Complete', meta: { headerClassName: head, cellClassName: 'text-secondary' } }),
    column.accessor('status', { header: 'Status', cell: info => <EmployeeStatus status={info.getValue()}/>, meta: { headerClassName: `${head} px-5`, cellClassName: 'px-5' } }),
  ], [money])

  return <section className="overflow-hidden rounded-xl border border-border bg-white">
    <div className="flex items-center justify-between gap-3 border-b border-border p-5">
      <div className="min-w-0"><h2 className="text-sm font-extrabold">Employees</h2><p className="mt-1 text-[9px] text-muted-foreground">Compensation, tax setup, benefits, and payment details</p></div>
      <KitButton className="shrink-0" onClick={onAdd}><Plus size={13}/> Add employee</KitButton>
    </div>
    <div className="text-[10px]">
      <DataTable
        columns={columns}
        data={employees}
        minWidthClassName="min-w-[760px]"
        getRowId={row => row.name}
        emptyState="No employees yet."
        renderMobileCard={person => <div className="p-4 text-[10px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><b className="text-xs">{person.name}</b><p className="mt-1 text-[9px] text-muted-foreground">{person.role}</p></div>
            <EmployeeStatus status={person.status}/>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0 text-[9px] text-muted-foreground"><p>{person.type} · Full-time</p><p className="mt-0.5">{person.account} · <span className="text-secondary">Tax complete</span></p></div>
            <p className="shrink-0 text-xs font-extrabold">{money(person.amount)}</p>
          </div>
        </div>}
      />
    </div>
  </section>
}
