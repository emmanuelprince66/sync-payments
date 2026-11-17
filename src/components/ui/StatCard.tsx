import { Icon, type IconName } from './Icon'

/** `change` is an optional chip (trend or context). Leave it out when there is no real figure to show. */
export function StatCard({ label, value, change, icon, color }: { label: string; value: string; change?: string; icon: IconName; color: string }) {
  return <div className="rounded-2xl border border-[#E7E8EA] bg-white p-5 shadow-[0_8px_28px_rgba(30,30,30,.035)]">
    <div className="flex items-start justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15`, color }}><Icon name={icon} size={19}/></div>
      {change && <span className="rounded-full bg-[#FFF1E4] px-2 py-1 text-[10px] font-extrabold text-[#AD5300]">{change}</span>}
    </div>
    <div className="mt-5 text-2xl font-black tracking-[-0.5px] text-[#1E1E1E]">{value}</div>
    <div className="mt-1 text-xs font-semibold text-[#6D7176]">{label}</div>
  </div>
}
