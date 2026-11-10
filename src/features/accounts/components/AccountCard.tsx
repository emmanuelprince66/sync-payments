import { Check, Copy, Landmark } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { useClipboard } from '@/hooks/useClipboard'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { groupAccount } from '@/features/transactions/format'

export type AccountCardData = { accountNumber: string; bankName: string; accountName: string; balance: number }

/** The design's dark collection-account card. */
export function AccountCard({ account, loading, compact = false }: { account: AccountCardData | null; loading?: boolean; compact?: boolean }) {
  const { copied, copy } = useClipboard(1600)
  const money = useFormatMoney()
  const { code } = useBusinessCurrency()
  const number = account?.accountNumber ?? ''

  return <section className={cn('relative min-w-0 overflow-hidden bg-primary text-white', compact ? 'rounded-2xl p-5' : 'rounded-[22px] p-6 md:p-7')}>
    <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[32px] border-white/[.035]"/>
    <div className="absolute -bottom-14 right-28 h-32 w-32 rounded-full border-[24px] border-secondary/10"/>
    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/55"><Landmark size={13} className="shrink-0"/> {code} collection account</div>
          {loading
            ? <Skeleton className="mt-5 h-8 w-52 max-w-full bg-white/10"/>
            : <div className={cn('font-extrabold tracking-[0.04em]', compact ? 'mt-4 text-xl' : 'mt-5 text-2xl md:text-[28px]')}>{number ? groupAccount(number) : 'No account yet'}</div>}
          <p className="mt-1.5 truncate text-xs text-white/55">{account ? `${account.bankName || 'Bank'} · ${account.accountName}` : 'Complete verification to open your account'}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-extrabold text-[#BDE7C6]">{number ? 'ACTIVE' : 'PENDING'}</span>
      </div>
      {!compact && <div className="mt-7 flex flex-wrap items-end justify-between gap-5 border-t border-white/10 pt-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Available balance</p>
          {loading ? <Skeleton className="mt-1 h-8 w-40 bg-white/10"/> : <p className="mt-1 text-2xl font-extrabold [overflow-wrap:anywhere]">{money(account?.balance ?? 0)}</p>}
        </div>
        <button type="button" disabled={!number} onClick={() => void copy(`${account?.accountName} · ${account?.bankName} · ${number}`)} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-extrabold hover:bg-white/15 disabled:opacity-50">
          {copied ? <Check size={14}/> : <Copy size={14}/>}{copied ? 'Copied' : 'Copy details'}
        </button>
      </div>}
    </div>
  </section>
}
