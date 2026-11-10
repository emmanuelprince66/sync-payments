import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import type { BusinessCardModel } from '../hooks/useSelectBusinessPage'

/** One business in the picker. The whole card is the button. */
export function BusinessCard({ card, onSelect }: { card: BusinessCardModel; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={cn('group flex w-full min-w-0 items-center gap-3 sm:gap-4 rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#529661] hover:shadow-[0_14px_34px_rgba(17,49,37,.08)] sm:p-5', card.isCurrent ? 'border-[#529661] ring-4 ring-[#529661]/10' : 'border-[#E0E8E3]')}>
    {card.business.logo
      ? <img src={card.business.logo} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-[#E7EDE9] object-cover"/>
      : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF5E9] text-sm font-black text-[#438352]">{card.initials}</span>}
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-2">
        <span className="truncate text-sm font-extrabold text-[#17382C]">{card.name}</span>
        {card.isCurrent && <span className="shrink-0 rounded-full bg-[#E4F2E1] px-2 py-0.5 text-[9px] font-extrabold text-[#438352]">Current</span>}
      </span>
      <span className="mt-1 block truncate text-[11px] text-[#829189]">{card.address}</span>
      {card.type && <span className="mt-2 inline-flex rounded-full bg-[#F1F5F2] px-2 py-0.5 text-[9px] font-bold text-[#5E7268]">{card.type}</span>}
    </span>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9AA8A1] transition group-hover:bg-[#EAF5E9] group-hover:text-[#438352]"><Icon name="arrow" size={16}/></span>
  </button>
}

/** Dashed "Create a new business" tile at the end of the list. */
export function CreateBusinessTile({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-4 text-left transition hover:border-[#529661] hover:bg-white sm:p-5">
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#438352] shadow-sm"><Icon name="plus" size={20}/></span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-extrabold text-[#17382C]">Create a new business</span>
      <span className="mt-1 block text-[11px] text-[#829189]">Add another store or brand to your account</span>
    </span>
  </button>
}
