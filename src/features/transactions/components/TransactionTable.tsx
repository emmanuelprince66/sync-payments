import { createColumnHelper } from '@tanstack/react-table'
import { ReceiptText } from 'lucide-react'
import { useMemo } from 'react'
import type { WalletTrx } from '@/api/transactions'
import { DataTable } from '@/components/ui/DataTable'
import { KitEmpty, kitTableClass, stretchedButton } from '@/components/ui/KitExtras'
import { StatusPill } from '@/components/ui/PaymentKit'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { trxChannel, trxCustomer, trxDay, trxInitials, trxShortId, trxStatus, trxTime } from '../format'

const column = createColumnHelper<WalletTrx>()

type TransactionTableProps = {
  rows: WalletTrx[]
  loading?: boolean
  /** The selected wallet account: the design's "Branch" column. */
  accountLabel: string
  onSelect: (trx: WalletTrx) => void
  emptyNote?: string
}

function Amount({ trx }: { trx: WalletTrx }) {
  const money = useFormatMoney()
  const out = trx.type === 'DEBIT'
  return <span className={cn('font-extrabold', out ? 'text-[#C72D34]' : 'text-foreground')}>{out ? '−' : '+'}{money(trx.amount)}</span>
}

/** The design's transaction table, as cards on phones. */
export function TransactionTable({ rows, loading, accountLabel, onSelect, emptyNote = 'Payments will appear here as they come in.' }: TransactionTableProps) {
  const columns = useMemo(() => [
    column.display({
      id: 'customer',
      header: 'Sender / customer',
      meta: { headerClassName: 'px-5', cellClassName: 'px-5' },
      cell: ({ row: { original: trx } }) => <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[9px] font-extrabold text-secondary">{trxInitials(trx)}</div>
        <div><p className="max-w-[200px] truncate font-extrabold text-foreground">{trxCustomer(trx)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{trxShortId(trx.id)}</p></div>
      </div>,
    }),
    column.display({
      id: 'branch',
      header: 'Branch',
      cell: ({ row: { original: trx } }) => <><p className="max-w-[160px] truncate font-extrabold text-foreground/80">{accountLabel}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{trx.channel.toUpperCase() === 'TERMINAL' ? trx.description || 'Terminal' : 'Online collection'}</p></>,
    }),
    column.display({
      id: 'source',
      header: 'Payment source',
      cell: ({ row: { original: trx } }) => <><p className="font-bold text-foreground/75">{trxChannel(trx.channel)}</p><p className="mt-0.5 max-w-[160px] truncate font-mono text-[9px] text-muted-foreground">{trx.reference}</p></>,
    }),
    column.display({
      id: 'date',
      header: 'Date',
      cell: ({ row: { original: trx } }) => <><p className="font-bold text-foreground/75">{trxDay(trx.createdAt)}</p><p className="text-[10px] text-muted-foreground">{trxTime(trx.createdAt)}</p></>,
    }),
    column.display({ id: 'status', header: 'Status', cell: ({ row: { original: trx } }) => <StatusPill value={trxStatus(trx.status)}/> }),
    column.display({
      id: 'amount',
      header: 'Amount',
      meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      cell: ({ row: { original: trx } }) => <Amount trx={trx}/>,
    }),
    column.display({
      id: 'details',
      header: 'Details',
      meta: { headerClassName: 'px-5 text-right', cellClassName: 'px-5 text-right' },
      cell: ({ row: { original: trx } }) => <button type="button" onClick={() => onSelect(trx)} className={cn('cursor-pointer rounded-md border border-border px-2.5 py-1.5 text-[9px] font-extrabold text-secondary hover:border-secondary hover:bg-accent', stretchedButton)}>View more</button>,
    }),
  ], [accountLabel, onSelect])

  return <DataTable
    columns={columns}
    data={rows}
    loading={loading}
    minWidthClassName="min-w-[980px]"
    className={kitTableClass}
    getRowId={row => row.id}
    emptyState={<KitEmpty icon={<ReceiptText size={18}/>} title="No transactions found" note={emptyNote} className="py-4"/>}
    mobileListClassName="divide-y divide-border/70"
    renderMobileCard={trx => <button type="button" onClick={() => onSelect(trx)} className="flex w-full items-center gap-3 p-4 text-left text-xs">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[9px] font-extrabold text-secondary">{trxInitials(trx)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-extrabold text-foreground">{trxCustomer(trx)}</span>
        <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{trxChannel(trx.channel)} · {trxDay(trx.createdAt)}, {trxTime(trx.createdAt)}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block"><Amount trx={trx}/></span>
        <span className="mt-1 block"><StatusPill value={trxStatus(trx.status)}/></span>
      </span>
    </button>}
  />
}
