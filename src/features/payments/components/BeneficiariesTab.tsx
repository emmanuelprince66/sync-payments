import { Plus, UsersRound } from 'lucide-react'
import type { RecentBeneficiary } from '@/api/transactions'
import { KitEmpty } from '@/components/ui/KitExtras'
import { KitButton } from '@/components/ui/PaymentKit'
import { Skeleton } from '@/components/ui/Skeleton'
import { initials } from '@/lib/format'

type BeneficiariesTabProps = { rows: RecentBeneficiary[]; loading: boolean; onAdd: () => void; onPay: (row: RecentBeneficiary) => void }

/** Accounts this business has paid: the API keeps no separate saved list. */
export function BeneficiariesTab({ rows, loading, onAdd, onPay }: BeneficiariesTabProps) {
  return <section className="overflow-hidden rounded-xl border border-border bg-white">
    <div className="flex items-center justify-between gap-3 border-b border-border p-5">
      <div className="min-w-0"><h2 className="text-sm font-extrabold">Saved beneficiaries</h2><p className="mt-1 text-[9px] text-muted-foreground">Verified bank accounts you have paid before</p></div>
      <KitButton className="shrink-0" onClick={onAdd}><Plus size={13}/> Add beneficiary</KitButton>
    </div>
    {loading
      ? <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-border md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-3 bg-white p-5"><Skeleton className="h-10 w-10 rounded-full"/><div className="flex-1"><Skeleton className="h-3 w-32"/><Skeleton className="mt-2 h-2.5 w-24"/></div></div>)}</div>
      : rows.length === 0
        ? <KitEmpty icon={<UsersRound size={18}/>} title="No beneficiaries yet" note="Make your first transfer and the account will be listed here."/>
        : <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-border md:grid-cols-2">{rows.map(row => <button key={`${row.bankCode}-${row.accountNumber}`} type="button" onClick={() => onPay(row)} className="flex min-w-0 items-center bg-white p-5 text-left hover:bg-[#F8FAF8]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-extrabold text-secondary">{initials(row.accountName || 'B')}</span>
          <span className="ml-3 min-w-0"><span className="block truncate text-xs font-extrabold">{row.accountName || 'Beneficiary'}</span><span className="mt-1 block truncate text-[9px] text-muted-foreground">{row.bankName} •• {row.accountNumber.slice(-4)}</span></span>
          <span className="ml-auto shrink-0 pl-2 text-[8px] font-extrabold text-secondary">VERIFIED</span>
        </button>)}</div>}
  </section>
}
