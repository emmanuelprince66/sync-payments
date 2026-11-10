import { Icon, type IconName } from './Icon'

/** `change` is an optional chip (trend or context). Leave it out when there is no real figure to show. */
export function StatCard({ label, value, change, icon, color }: { label: string; value: string; change?: string; icon: IconName; color: string }) {
  return <div className="rounded-2xl border border-[#E2EAE5] bg-white p-5 shadow-[0_8px_28px_rgba(18,52,39,.035)]">
    <div className="flex items-start justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15`, color }}><Icon name={icon} size={19}/></div>
      {change && <span className="rounded-full bg-[#EAF6E9] px-2 py-1 text-[10px] font-extrabold text-[#438352]">{change}</span>}
    </div>
    <div className="mt-5 text-2xl font-black tracking-[-0.5px] text-[#09261C]">{value}</div>
    <div className="mt-1 text-xs font-semibold text-[#75857D]">{label}</div>
  </div>
}
