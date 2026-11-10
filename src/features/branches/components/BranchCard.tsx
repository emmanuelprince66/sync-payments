import { Store } from 'lucide-react'
import type { Branch } from '@/api/branches'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'

export function BranchCard({ branch, active, onSelect }: { branch: Branch; active: boolean; onSelect: () => void }) {
  const money = useFormatMoney()
  return <button type="button" onClick={onSelect} className={cn('min-w-0 rounded-xl border bg-white p-4 text-left transition', active ? 'border-secondary shadow-[0_0_0_2px_rgba(82,150,97,.12)]' : 'border-border hover:border-secondary/40')}>
    <div className="flex items-start justify-between">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-secondary"><Store size={16}/></div>
      <span className={cn('rounded px-2 py-1 text-[8px] font-extrabold', branch.isMain ? 'bg-accent text-secondary' : 'bg-[#E7F1FC] text-[#1C6FA8]')}>{branch.isMain ? 'MAIN' : 'SUB-ACCOUNT'}</span>
    </div>
    <p className="mt-4 truncate text-sm font-extrabold">{branch.name}</p>
    <p className="mt-1 truncate text-[9px] text-muted-foreground">•• {branch.accountNumber.slice(-4)} · {branch.terminals} terminal{branch.terminals === 1 ? '' : 's'} · {branch.bankName}</p>
    <div className="mt-4 flex items-end justify-between gap-2 border-t border-border pt-3">
      <div className="min-w-0"><p className="text-[9px] text-muted-foreground">Today</p><p className="mt-1 truncate text-lg font-extrabold">{money(branch.todayVolume)}</p></div>
      <p className="shrink-0 text-[9px] font-bold text-muted-foreground">{branch.todayPayments} payments</p>
    </div>
  </button>
}
