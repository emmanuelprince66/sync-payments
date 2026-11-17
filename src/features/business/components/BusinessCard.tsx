import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import type { BusinessCardModel } from '../hooks/useSelectBusinessPage'

/** One business in the picker. The whole card is the button. */
export function BusinessCard({ card, onSelect }: { card: BusinessCardModel; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={cn('group flex w-full min-w-0 items-center gap-3 sm:gap-4 rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#FF7F00] hover:shadow-[0_14px_34px_rgba(30,30,30,.08)] sm:p-5', card.isCurrent ? 'border-[#FF7F00] ring-4 ring-[#FF7F00]/10' : 'border-[#E7E8EA]')}>
    {card.business.logo
      ? <img src={card.business.logo} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-[#E7E8EA] object-cover"/>
      : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E4] text-sm font-black text-[#AD5300]">{card.initials}</span>}
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-2">
        <span className="truncate text-sm font-extrabold text-[#1E1E1E]">{card.name}</span>
        {card.isCurrent && <span className="shrink-0 rounded-full bg-[#FFF1E4] px-2 py-0.5 text-[9px] font-extrabold text-[#AD5300]">Current</span>}
      </span>
      <span className="mt-1 block truncate text-[11px] text-[#6D7176]">{card.address}</span>
      {card.type && <span className="mt-2 inline-flex rounded-full bg-[#F0F1F2] px-2 py-0.5 text-[9px] font-bold text-[#6D7176]">{card.type}</span>}
    </span>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6D7176] transition group-hover:bg-[#FFF1E4] group-hover:text-[#AD5300]"><Icon name="arrow" size={16}/></span>
  </button>
}

/** Dashed "Create a new business" tile at the end of the list. */
export function CreateBusinessTile({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-[#C9CACE] bg-[#FAFAFA] p-4 text-left transition hover:border-[#FF7F00] hover:bg-white sm:p-5">
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#AD5300] shadow-sm"><Icon name="plus" size={20}/></span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-extrabold text-[#1E1E1E]">Create a new business</span>
      <span className="mt-1 block text-[11px] text-[#6D7176]">Add another store or brand to your account</span>
    </span>
  </button>
}
